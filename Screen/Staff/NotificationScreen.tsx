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

export default function NotificationScreen() {
  const router = useRouter();
  const [t, setT] = useState(getTranslations('en'));
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('employee');

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
      
      // Get current user ID
      const currentUserId = await AsyncStorage.getItem('userId');
      if (!currentUserId) {
        console.log('No user ID available for filtering notifications');
        setNotifications([]);
        setLoading(false);
        return;
      }

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
      // Staff should only see task_assigned notifications assigned to them
      // Admin should only see alert_response notifications
      if (userRole === 'employee') {
        allNotifications = allNotifications.filter(notif => {
          // First check if it's a task_assigned notification
          if (notif.data?.type !== 'task_assigned') {
            return false;
          }
          // Then check if current user is in the assigned_user_ids array
          const assignedUserIds = notif.data?.assigned_user_ids;
          if (assignedUserIds && Array.isArray(assignedUserIds)) {
            return assignedUserIds.includes(currentUserId);
          }
          // If assigned_user_ids is not available (old notifications), show it for backward compatibility
          return true;
        });
      } else if (userRole === 'admin') {
        allNotifications = allNotifications.filter(notif =>
          notif.data?.type === 'alert_response'
        );
      }

      console.log(`Loaded ${allNotifications.length} notifications from storage (filtered for ${userRole}, user: ${currentUserId})`);
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

    // Navigate to employee screen for all notifications
    // If threatId is available, pass it to show the specific task
    if (notification.data && notification.data.threat_id) {
      router.push({
        pathname: '/employee',
        params: {
          threatId: notification.data.threat_id,
        },
      });
    } else {
      // If no threatId, just navigate to employee screen
      router.push('/employee');
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

  // Group notifications by date
  const groupNotificationsByDate = (notifications: NotificationItem[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: NotificationItem[] } = {
      Today: [],
      Yesterday: [],
      Older: [],
    };

    notifications.forEach((notification) => {
      const notifDate = new Date(notification.date);
      const notifDateOnly = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      if (notifDateOnly.getTime() === today.getTime()) {
        groups.Today.push(notification);
      } else if (notifDateOnly.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(notification);
      } else {
        groups.Older.push(notification);
      }
    });

    return groups;
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
      console.log('Notification received in NotificationScreen:', notification.request.content.title);
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
      console.log('Notification tapped in NotificationScreen:', notification.request.content.title);
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
      console.log('NotificationScreen focused - reloading notifications');
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
            />
          }>
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No notifications</Text>
            </View>
          ) : (() => {
            const groupedNotifications = groupNotificationsByDate(notifications);
            const sections = [
              { title: 'Today', notifications: groupedNotifications.Today },
              { title: 'Yesterday', notifications: groupedNotifications.Yesterday },
              { title: 'Older', notifications: groupedNotifications.Older },
            ].filter(section => section.notifications.length > 0);

            return sections.map((section) => (
              <View key={section.title} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Image
                    source={require('../../assets/icons/calender.png')}
                    style={styles.calendarIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                {section.notifications.map((notification) => {
                  const cameraLocation = getCameraLocation(notification);
                  
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
                              {notification.title}
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
                        {cameraLocation ? (
                          <Text style={styles.notificationSubtext} numberOfLines={1} ellipsizeMode="tail">
                            {cameraLocation}
                          </Text>
                        ) : (
                          <Text style={styles.notificationSubtext} numberOfLines={1} ellipsizeMode="tail">
                            {notification.body}
                          </Text>
                        )}
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
    // Reduce gap between Today / Yesterday / Older sections
    marginBottom: 12,
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
    maxWidth: "90%",
  },
  notificationTitle: {
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: 500,
    color: colors.text,
    lineHeight: 20,
  },
  notificationSubtext: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: 400,
    color: colors.subtext,
    lineHeight: 18,
    marginTop: 5,
  },
  notificationTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
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
    flex: 1,
  },
  attachmentIcon: {
    width: 16,
    height: 16,
    tintColor: colors.primary,
  },
});

