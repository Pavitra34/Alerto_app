import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CartBox from '../../components/common/CartBox';
import Header from '../../components/common/Header';
import colors from '../../styles/Colors';
import { registerForPushNotificationsAsync, savePushTokenToBackend } from '../../utils/notificationService';
// @ts-ignore
import { getTranslations } from '../../assets/Translation';
import fonts from '../../styles/Fonts';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  data?: any;
  date: Date;
  read: boolean;
}

export default function AdminNotificationScreen() {
  const router = useRouter();
  const [t, setT] = useState(getTranslations('en'));
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('admin');

  // Load language
  const loadLanguage = async () => {
    try {
      const storedLangId = await AsyncStorage.getItem('langId') || 'en';
      setT(getTranslations(storedLangId));
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  // Register for push notifications
  const registerForNotifications = async () => {
    try {
      const currentUserId = await AsyncStorage.getItem('userId');
      if (currentUserId) {
        setUserId(currentUserId);
      }

      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);

        // Save token to backend if user is logged in
        if (currentUserId && token) {
          try {
            await savePushTokenToBackend(currentUserId, token);
            console.log('Push token saved to backend');
          } catch (error) {
            console.error('Error saving push token to backend:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error registering for notifications:', error);
    }
  };

  // Load user role
  const loadUserRole = async () => {
    try {
      const userObjString = await AsyncStorage.getItem('userObj');
      if (userObjString) {
        const userObj = JSON.parse(userObjString);
        if (userObj.role) {
          setUserRole(userObj.role);
        }
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);

      // Get stored notifications from AsyncStorage
      const storedNotifications = await AsyncStorage.getItem('notifications');
      const parsedNotifications: NotificationItem[] = storedNotifications
        ? JSON.parse(storedNotifications)
        : [];

      // Convert date strings to Date objects and sort by date (newest first)
      let allNotifications = parsedNotifications
        .map(notif => ({
          ...notif,
          date: typeof notif.date === 'string' ? new Date(notif.date) : notif.date
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      // Filter notifications based on user role
      // Staff should only see task_assigned notifications
      // Admin should only see alert_response notifications
      if (userRole === 'employee') {
        allNotifications = allNotifications.filter(notif =>
          notif.data?.type === 'task_assigned'
        );
      } else if (userRole === 'admin') {
        allNotifications = allNotifications.filter(notif =>
          notif.data?.type === 'alert_response'
        );
      }

      console.log(`Loaded ${allNotifications.length} notifications from storage (filtered for ${userRole})`);
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Save notification to storage
  const saveNotification = async (notification: NotificationItem) => {
    try {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      const existingNotifications: NotificationItem[] = storedNotifications
        ? JSON.parse(storedNotifications)
        : [];

      // Check if notification already exists (avoid duplicates)
      const exists = existingNotifications.some((n: any) =>
        n.id === notification.id ||
        (n.title === notification.title &&
          n.body === notification.body &&
          Math.abs(new Date(n.date).getTime() - notification.date.getTime()) < 5000)
      );

      if (!exists) {
        // Convert date to ISO string for storage
        const notificationToSave = {
          ...notification,
          date: notification.date instanceof Date ? notification.date.toISOString() : notification.date
        };

        // Add new notification at the beginning
        const updatedNotifications = [notificationToSave, ...existingNotifications];

        // Keep only last 100 notifications
        const limitedNotifications = updatedNotifications.slice(0, 100);

        await AsyncStorage.setItem('notifications', JSON.stringify(limitedNotifications));
        console.log('Notification saved:', notification.title);
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      if (!storedNotifications) return;

      const parsedNotifications: NotificationItem[] = JSON.parse(storedNotifications);
      const updatedNotifications = parsedNotifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );

      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification press
  const handleNotificationPress = (notification: NotificationItem) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification data
    if (notification.data) {
      if (notification.data.type === 'alert_response' && notification.data.threat_id) {
        // Navigate to alerts screen with threat_id and switch to reviewed tab
        router.push({
          pathname: '/alerts',
          params: {
            threatId: notification.data.threat_id,
            tab: 'reviewed', // Switch to reviewed tab
          },
        });
      } else if (notification.data.type === 'task_assigned' && notification.data.threat_id) {
        // Navigate to alerts screen for task assignment notifications
        router.push({
          pathname: '/alerts',
          params: {
            threatId: notification.data.threat_id,
            tab: 'assigned', // Switch to assigned tab
          },
        });
      }
    }
  };

  // Format date for time ago
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (hours < 24) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (days < 7) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return dateObj.toLocaleDateString();
    }
  };

  const getDateKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const formatSectionTitleForDate = (d: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (dateOnly.getTime() === today.getTime()) return 'Today';
    if (dateOnly.getTime() === yesterday.getTime()) return 'Yesterday';

    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Group notifications by date sections: Today, Yesterday, then specific date (instead of "Older")
  const buildNotificationSections = (items: NotificationItem[]) => {
    const buckets = new Map<string, { title: string; dateOnly: Date; notifications: NotificationItem[] }>();

    items.forEach((notification) => {
      const notifDate = new Date(notification.date);
      const dateOnly = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());
      const key = getDateKey(dateOnly);

      const existing = buckets.get(key);
      if (existing) {
        existing.notifications.push(notification);
        return;
      }

      buckets.set(key, {
        title: formatSectionTitleForDate(dateOnly),
        dateOnly,
        notifications: [notification],
      });
    });

    // Sort sections by dateOnly desc (newest day first)
    const sections = Array.from(buckets.values()).sort(
      (a, b) => b.dateOnly.getTime() - a.dateOnly.getTime()
    );

    // Keep "Today" and "Yesterday" at top (already sorted, but this enforces order)
    const todaySection = sections.find(s => s.title === 'Today');
    const yesterdaySection = sections.find(s => s.title === 'Yesterday');
    const otherSections = sections.filter(s => s.title !== 'Today' && s.title !== 'Yesterday');

    return [
      ...(todaySection ? [todaySection] : []),
      ...(yesterdaySection ? [yesterdaySection] : []),
      ...otherSections,
    ].filter(s => s.notifications.length > 0);
  };

  // Get camera location from notification data
  const getCameraLocation = (notification: NotificationItem): string => {
    if (notification.data?.camera_location) {
      return notification.data.camera_location;
    }
    if (notification.data?.camera_name) {
      return notification.data.camera_name;
    }
    return '';
  };

  // Format notification title for admin
  const getNotificationTitle = (notification: NotificationItem): string => {
    // For alert_response notifications, show: "(username) has responded to the alert on cameraname"
    if (notification.data?.type === 'alert_response') {
      const employeeName = notification.data.employee_name || 'Employee';
      const cameraName = notification.data.camera_name || 'Camera';
      return `${employeeName} has responded to the alert on ${cameraName}`;
    }
    // For other notifications, use the original title
    return notification.title;
  };

  // Get response message for alert_response notifications
  const getResponseMessage = (notification: NotificationItem): string => {
    // For alert_response notifications, show the response message
    if (notification.data?.type === 'alert_response' && notification.data.response) {
      return notification.data.response;
    }
    // For other notifications, use camera location or body
    const cameraLocation = getCameraLocation(notification);
    return cameraLocation || notification.body;
  };

  // Refresh notifications
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  useEffect(() => {
    loadLanguage();
    loadUserRole();
    registerForNotifications();

    // Get user ID
    AsyncStorage.getItem('userId').then(id => {
      if (id) setUserId(id);
    });

    // Listen for notifications received while app is in foreground (additional listener for this screen)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in AdminNotificationScreen:', notification.request.content.title);
      const notificationItem: NotificationItem = {
        id: notification.request.identifier || `notif_${Date.now()}_${Math.random()}`,
        title: notification.request.content.title || '',
        body: notification.request.content.body || '',
        data: notification.request.content.data || {},
        date: new Date(),
        read: false,
      };
      saveNotification(notificationItem);
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const notification = response.notification;
      console.log('Notification tapped in AdminNotificationScreen:', notification.request.content.title);
      const notificationItem: NotificationItem = {
        id: notification.request.identifier || `notif_${Date.now()}_${Math.random()}`,
        title: notification.request.content.title || '',
        body: notification.request.content.body || '',
        data: notification.request.content.data || {},
        date: new Date(),
        read: false,
      };
      saveNotification(notificationItem);
      handleNotificationPress(notificationItem);
    });

    // Reload language periodically
    const interval = setInterval(() => {
      loadLanguage();
    }, 1000);

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      clearInterval(interval);
    };
  }, []);

  // Reload notifications when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('AdminNotificationScreen focused - reloading notifications');
      loadUserRole().then(() => {
        loadNotifications();
      });
    }, [userRole])
  );

  return (
    <View style={styles.container}>
      {Platform.OS === 'android' && (
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.secondary}
          translucent={false}
        />
      )}
      <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
        <Header
          left={{
            type: 'image',
            url: require('../../assets/icons/arrow.png'),
            width: 24,
            height: 24,
            onPress: () => router.back(),
          }}
          center={{
            type: 'text',
            value: 'Notification',
          }}
        />
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }>
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No notifications</Text>
            </View>
          ) : (() => {
            const sections = buildNotificationSections(notifications);

            return sections.map((section) => (
              <View key={`${section.title}-${getDateKey(section.dateOnly)}`} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Image
                    source={require('../../assets/icons/calender.png')}
                    style={styles.calendarIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                {section.notifications.map((notification) => {
                  const notificationTitle = getNotificationTitle(notification);
                  const responseMessage = getResponseMessage(notification);

                  return (
                    <TouchableOpacity
                      key={notification.id}
                      onPress={() => handleNotificationPress(notification)}
                      activeOpacity={0.7}>
                      <CartBox
                        width="100%"
                        height={97}
                        borderRadius={12}
                        borderWidth={notification.read ? 0 : 2}
                        borderColor={notification.read ? undefined : colors.primary}
                        paddingTop={12}
                        paddingBottom={12}
                        paddingRight={12}
                        paddingLeft={12}
                        marginBottom={12}
                        alignItems="flex-start">


                        <View style={styles.textContentContainer}>
                          <View style={styles.titleContainer}>
                            <Text style={styles.notificationTitle} numberOfLines={2} ellipsizeMode="tail">
                              {notificationTitle}
                            </Text>
                          </View>
                          <View style={styles.attachmentIconContainer}>
                            <Image
                              source={require('../../assets/icons/alert1.png')}
                              style={styles.attachmentIcon}
                              resizeMode="contain"
                            />
                          </View>
                        </View>

                        <Text style={styles.notificationSubtext} numberOfLines={1} ellipsizeMode="tail">
                          {responseMessage}
                        </Text>
                        <View style={styles.notificationTimeRow}>
                          <Image
                            source={require('../../assets/icons/clock_g.png')}
                            style={styles.clockIcon}
                            resizeMode="contain"
                          />
                          <Text style={styles.notificationTime} numberOfLines={1} ellipsizeMode="tail">
                            {formatDate(notification.date)}
                          </Text>
                        </View>


                      </CartBox>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ));
          })()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  safeAreaTop: {
    backgroundColor: colors.secondary,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    color: colors.subtext,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: fonts.size.l,
    fontFamily: fonts.family.regular,
    color: colors.subtext,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: colors.subtext,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: 400,
    color: colors.text,
  },
  notificationCardRow: {
    flexDirection: 'row',

  },
  textContentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: "100%",
  },
  titleContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    maxWidth:"90%"
  },
  notificationTitle: {
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: 500,
    color: colors.text,
    lineHeight: 20,
  },
  subtextContainer: {
    marginBottom: 10

  },
  notificationSubtext: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: 400,
    color: colors.subtext,
    lineHeight: 18,
    marginTop:5
  },
  notificationTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
   marginTop:6,

  },
  clockIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: colors.subtext,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: 400,
    color: colors.subtext,
  },
  attachmentIconContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    flex:1,

  },
  attachmentIcon: {
    width: 16,
    height: 16,
    tintColor: colors.primary,
  },
});

