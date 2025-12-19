import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from 'expo-av';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { findCameraById } from '../../api/Camera';
import { getEmployeeActiveStatus, setEmployeeActiveStatus } from '../../api/employeeActive';
import { sendNotificationToUsers } from '../../api/notifications';
import { findTasksByUserId, ReportMessageEntry, Task, updateTask } from '../../api/Tasks';
import { findThreatById } from '../../api/Threat';
import { getUsersByRole } from '../../api/users';
import { Button1 } from '../../components/common/Button';
import CartBox from '../../components/common/CartBox';
import Header from '../../components/common/Header';
import Popup from '../../components/common/Popup';
import Toast, { showSuccessToast, toastConfig } from '../../components/common/Toast';
import colors from '../../styles/Colors';
import Footer from '../Footer';
// @ts-ignore
import { getTranslations } from '../../assets/Translation';
import fonts from '../../styles/Fonts';

interface TaskWithThreat {
  taskId: string;
  threatId: string;
  threatType: string;
  threatLevel: string;
  cameraId: string;
  cameraName: string;
  cameraLocation: string;
  cameraView: string;
  createdAt: string;
  reviewStatus: boolean;
}

interface AlertResponse {
  id: string;
  responseTime: string; // Current time when response was made
  responseDate: string; // Current date when response was made (YYYY-MM-DD)
  taskId: string;
  threatId: string;
  threatType: string;
  threatLevel?: string; // Optional for backward compatibility
  cameraId: string;
  cameraName: string;
  cameraLocation: string;
  cameraView: string;
  threatCreatedAt: string; // Original threat creation time
  alertType: 'true' | 'false';
  selectedOption: string;
  customInput: string;
  fullResponse: string;
  userId: string;
}

export default function EmployeeScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('Employee');
  const [userId, setUserId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showConfirmPopup, setShowConfirmPopup] = useState<boolean>(false);
  const [showConfirmInactivePopup, setShowConfirmInactivePopup] = useState<boolean>(false);
  const [userTasks, setUserTasks] = useState<TaskWithThreat[]>([]);
  const [allTasksResponded, setAllTasksResponded] = useState<boolean>(false);
  const [allAssignedTasks, setAllAssignedTasks] = useState<TaskWithThreat[]>([]); // Track all assigned tasks
  const hasShownLoginToast = useRef<boolean>(false);
  const [showAlertResponseModal, setShowAlertResponseModal] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'true' | 'false'>('true');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [showSendReportPopup, setShowSendReportPopup] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [langId, setLangId] = useState<string>('en');
  const [t, setT] = useState(getTranslations('en'));
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});
  const [thumbnailLoading, setThumbnailLoading] = useState<Record<string, boolean>>({});
  const [tasksLoading, setTasksLoading] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  

  // Load user data and active status on mount and when screen is focused
  useEffect(() => {
    // Get user data from AsyncStorage
    const loadUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId') || '';
        setUserId(storedUserId);
        
        const userObjString = await AsyncStorage.getItem('userObj');
        if (userObjString) {
          const userObj = JSON.parse(userObjString);
          setUserName(userObj.fullname || userObj.username || 'Employee');
        }
        
        // Load language
        const storedLangId = await AsyncStorage.getItem('langId') || 'en';
        setLangId(storedLangId);
        const translations = getTranslations(storedLangId);
        setT(translations);
        
        // Load active status from API
        if (storedUserId) {
          try {
            const activeStatus = await getEmployeeActiveStatus(storedUserId);
            if (activeStatus === true) {
              setIsActive(true);
              // Load tasks if user is active
              setTimeout(() => loadUserTasks(storedUserId), 100);
              
              // Also save to AsyncStorage for local state
              const today = new Date().toISOString().split('T')[0];
              await AsyncStorage.setItem('userActiveStatus', JSON.stringify({
                isActive: true,
                date: today
              }));
            } else {
              setIsActive(false);
              await AsyncStorage.removeItem('userActiveStatus');
            }
          } catch (error) {
            console.error('Error loading active status from API:', error);
            // Fallback to AsyncStorage if API fails
            const activeStatusData = await AsyncStorage.getItem('userActiveStatus');
            if (activeStatusData) {
              const { isActive: storedIsActive, date: storedDate } = JSON.parse(activeStatusData);
              const today = new Date().toISOString().split('T')[0];
              if (storedDate === today && storedIsActive) {
                setIsActive(true);
                if (storedUserId) {
                  setTimeout(() => loadUserTasks(storedUserId), 100);
                }
              } else {
                setIsActive(false);
                await AsyncStorage.removeItem('userActiveStatus');
              }
            } else {
              setIsActive(false);
            }
          }
        } else {
          setIsActive(false);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    // Set current date
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));

    loadUserData();
    loadUnreadCount();
  }, []); // Run on mount and when component remounts

  // Reload tasks when screen is focused (e.g., when returning from other screens or when task is assigned)
  useFocusEffect(
    React.useCallback(() => {
      if (userId && isActive) {
        // Reload tasks when screen comes into focus
        console.log('Screen focused - reloading tasks for user:', userId);
        loadUserTasks(userId);
      }
      // Always reload unread count when screen is focused
      loadUnreadCount();
    }, [userId, isActive])
  );

  // Disable Android hardware back button on this screen
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== 'android') return;
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => backHandler.remove();
    }, [])
  );

  // Handle login success toast separately
  useEffect(() => {
    if (params.showLoginSuccess === 'true' && !hasShownLoginToast.current && t) {
      // Use setTimeout to ensure it shows after screen is fully loaded
      setTimeout(() => {
        showSuccessToast(t.loginSuccessful);
        hasShownLoginToast.current = true;
      }, 500);
    }
  }, [params.showLoginSuccess, t]); // Depend on showLoginSuccess and translations

  // Update translations when langId changes
  useEffect(() => {
    setT(getTranslations(langId));
  }, [langId]);

  const handleGoActive = () => {
    if (isActive) {
      // If already active, show inactive confirmation popup
      setShowConfirmInactivePopup(true);
    } else {
      // If inactive, show active confirmation popup
      setShowConfirmPopup(true);
    }
  };

  const loadUserTasks = async (userIdParam?: string) => {
    setTasksLoading(true);
    try {
      const currentUserId = userIdParam || userId;
      if (!currentUserId) {
        console.log('No user ID available for loading tasks');
        return;
      }
      
      console.log('Loading tasks for user:', currentUserId);
      
      // Get tasks assigned to this user from database
      const tasks = await findTasksByUserId(currentUserId);
      //console.log('Found tasks for user:', currentUserId, tasks);
      
      // Additional filter: Ensure user_id is actually in the task's user_ids array
      const filteredTasks = tasks.filter((task: Task) => {
        if (!task.user_ids || !Array.isArray(task.user_ids)) {
          return false;
        }
        return task.user_ids.includes(currentUserId);
      });
      
      //console.log('Filtered tasks (user in user_ids array):', filteredTasks.length, 'out of', tasks.length);
      
      if (filteredTasks.length === 0) {
        console.log('No tasks found for user:', currentUserId);
        setAllAssignedTasks([]);
        setUserTasks([]);
        setAllTasksResponded(false);
        return;
      }
      
      // For each task, get threat and camera details (async)
      const tasksWithDetailsPromises = filteredTasks.map(async (task: Task) => {
        try {
          const threat = await findThreatById(task.threat_id);
          //console.log('Looking for threat:', task.threat_id, 'Found:', threat);
          if (!threat) {
            console.warn('Threat not found for task:', task._id, 'threat_id:', task.threat_id);
            return null;
          }
          
          const camera = await findCameraById(threat.camera_id);
          if (!camera) {
            console.warn('Camera not found for threat:', threat._id, 'camera_id:', threat.camera_id);
            return null;
          }
          
          const threatLevel = threat.threat_level || 'N/A';
          //console.log('Threat level for', threat._id, ':', threatLevel);
          
          return {
            taskId: task._id,
            threatId: threat._id,
            threatType: threat.threat_type,
            threatLevel: threatLevel,
            cameraId: camera._id,
            cameraName: camera.name,
            cameraLocation: camera.location,
            cameraView: camera.camera_view,
            createdAt: threat.createdat,
            reviewStatus: task.review_status,
          };
        } catch (error) {
          console.error('Error loading task details for task:', task._id, error);
          return null;
        }
      });
      
      // Wait for all async operations to complete
      const tasksWithDetailsResults = await Promise.all(tasksWithDetailsPromises);
      const tasksWithDetails = tasksWithDetailsResults.filter((task): task is TaskWithThreat => task !== null);
      
      //console.log('Loaded tasks with details:', tasksWithDetails.length);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Filter to show only today's tasks
      // Check both threat creation date AND task creation date (for newly assigned tasks)
      // A task should show if:
      // 1. Threat was created today, OR
      // 2. Task was created today (newly assigned), OR  
      // 3. Task is unresponded (review_status = false) - show all unresponded tasks regardless of date
      const todayTasks = tasksWithDetails.filter(task => {
        // Show all unresponded tasks (regardless of date) - these are active assignments
        if (task.reviewStatus === false) {
          return true;
        }
        
        // For responded tasks, only show today's
        const threatDate = new Date(task.createdAt).toISOString().split('T')[0];
        return threatDate === today;
      });
      
      console.log('Today\'s tasks (including unresponded):', todayTasks.length, 'out of', tasksWithDetails.length);
      
      // Store all assigned tasks (before filtering out responded ones)
      setAllAssignedTasks(todayTasks);
      
      // Check if all tasks have been responded to (using all assigned tasks)
      await checkAllTasksResponded(currentUserId, todayTasks);
      
      // Filter out tasks that have already been responded to
      const unrespondedTasks = await filterRespondedTasks(currentUserId, todayTasks);
      setUserTasks(unrespondedTasks);
      //console.log('Loaded user tasks (unresponded):', unrespondedTasks.length);
    } catch (error) {
      console.error('Error loading user tasks:', error);
      setAllAssignedTasks([]);
      setUserTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const filterRespondedTasks = async (currentUserId: string, tasks: TaskWithThreat[]): Promise<TaskWithThreat[]> => {
    try {
      // Get alert history from AsyncStorage
      const historyData = await AsyncStorage.getItem('alertHistory');
      if (!historyData) {
        // No history means no tasks have been responded to
        return tasks;
      }
      
      const history: AlertResponse[] = JSON.parse(historyData);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Filter to get today's responses for this user
      const todayResponses = history.filter(h => {
        const responseDate = h.responseDate || new Date(h.threatCreatedAt).toISOString().split('T')[0];
        return h.userId === currentUserId && responseDate === today;
      });
      
      // Get all taskIds that have been responded to
      const respondedTaskIds = new Set(todayResponses.map(r => r.taskId));
      
      // Filter out tasks that have been responded to
      return tasks.filter(task => !respondedTaskIds.has(task.taskId));
    } catch (error) {
      console.error('Error filtering responded tasks:', error);
      return tasks;
    }
  };

  const checkAllTasksResponded = async (currentUserId: string, tasks: TaskWithThreat[]) => {
    try {
      // If no tasks assigned, set allTasksResponded to false
      if (tasks.length === 0) {
        setAllTasksResponded(false);
        return;
      }
      
      // Get alert history from AsyncStorage
      const historyData = await AsyncStorage.getItem('alertHistory');
      if (!historyData) {
        // No history means tasks haven't been responded to
        setAllTasksResponded(false);
        return;
      }
      
      const history: AlertResponse[] = JSON.parse(historyData);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Filter to get today's responses for this user
      const todayResponses = history.filter(h => {
        const responseDate = h.responseDate || new Date(h.threatCreatedAt).toISOString().split('T')[0];
        return h.userId === currentUserId && responseDate === today;
      });
      
      // Get all taskIds that have been responded to
      const respondedTaskIds = new Set(todayResponses.map(r => r.taskId));
      
      // Check if all tasks have been responded to
      const allResponded = tasks.length > 0 && tasks.every(task => respondedTaskIds.has(task.taskId));
      
      setAllTasksResponded(allResponded);
      console.log('All tasks responded:', allResponded, 'Total tasks:', tasks.length, 'Responded:', respondedTaskIds.size);
    } catch (error) {
      console.error('Error checking all tasks responded:', error);
      setAllTasksResponded(false);
    }
  };
  

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload user tasks
      await loadUserTasks();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleConfirmActive = async () => {
    if (!userId) {
      console.error('User ID not available');
      return;
    }

    try {
      // Call API to set active status to true
      await setEmployeeActiveStatus(userId, true);
      
      setIsActive(true);
      setShowConfirmPopup(false);
      console.log('User went active');
      
      // Save active status to AsyncStorage with today's date (for local state)
      try {
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem('userActiveStatus', JSON.stringify({
          isActive: true,
          date: today
        }));
        console.log('Active status saved to AsyncStorage');
      } catch (error) {
        console.error('Error saving active status to AsyncStorage:', error);
      }
      
      // Load tasks when user goes active - wait for it to complete
      console.log('Loading tasks after going active...');
      await loadUserTasks(userId);
      console.log('Tasks loaded after going active');
    } catch (error) {
      console.error('Error setting active status:', error);
      // Show error toast if needed
    }
  };

  const handleCancelActive = () => {
    setShowConfirmPopup(false);
    console.log('User cancelled going active');
  };

  const handleConfirmInactive = async () => {
    if (!userId) {
      console.error('User ID not available');
      return;
    }

    try {
      // Call API to set active status to false
      await setEmployeeActiveStatus(userId, false);
      
      setIsActive(false);
      setShowConfirmInactivePopup(false);
      setUserTasks([]); // Clear tasks when going inactive
      console.log('User went inactive');
      
      // Remove active status from AsyncStorage
      try {
        await AsyncStorage.removeItem('userActiveStatus');
        console.log('Active status removed from AsyncStorage');
      } catch (error) {
        console.error('Error removing active status from AsyncStorage:', error);
      }
    } catch (error) {
      console.error('Error setting inactive status:', error);
      // Show error toast if needed
    }
  };

  const handleCancelInactive = () => {
    setShowConfirmInactivePopup(false);
    console.log('User cancelled going inactive');
  };

  const handleNotificationPress = () => {
    router.push('/notifications');
  };

  // Load unread notification count
  const loadUnreadCount = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      if (!storedNotifications) {
        setUnreadCount(0);
        return;
      }
      
      const currentUserId = userId || await AsyncStorage.getItem('userId');
      if (!currentUserId) {
        setUnreadCount(0);
        return;
      }
      
      const parsedNotifications = JSON.parse(storedNotifications);
      const userObjString = await AsyncStorage.getItem('userObj');
      let userRole = 'employee';
      
      if (userObjString) {
        const userObj = JSON.parse(userObjString);
        userRole = userObj.role || 'employee';
      }
      
      // Filter notifications based on user role and assigned users
      let filteredNotifications = parsedNotifications;
      if (userRole === 'employee') {
        filteredNotifications = parsedNotifications.filter((notif: any) => {
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
        filteredNotifications = parsedNotifications.filter((notif: any) => 
          notif.data?.type === 'alert_response'
        );
      }
      
      // Count unread notifications
      const unread = filteredNotifications.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  };

  const getThreatLevelColor = (threatLevel: string): string => {
    const level = threatLevel?.toLowerCase() || '';
    if (level === 'high' || level === 'critical') {
      return '#FF0000'; // Red
    } else if (level === 'medium') {
      return '#F76800'; // Orange
    } else if (level === 'low') {
      return '#4CAF50'; // Green
    }
    return '#FF0000'; // Default to red
  };

  const formatThreatLevel = (level: string): string => {
    if (!level) return 'High';
    const levelLower = level.toLowerCase();
    // Handle critical as high
    if (levelLower === 'critical') {
      return 'High';
    }
    // Capitalize first letter, lowercase rest
    return levelLower.charAt(0).toUpperCase() + levelLower.slice(1);
  };

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
        <View style={styles.headerWrapper}>
          <Header
            center={{
              type: 'text',
              value: (showConfirmPopup || showConfirmInactivePopup) ? t.headerTitlePopup : t.headerTitle,
            }}
            right={{
              type: 'image',
              url: require('../../assets/icons/notification.png'),
              width: 24,
              height: 24,
              onPress: handleNotificationPress,
            }}
          />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeTitle}>{t.welcome} {userName}</Text>
              <Text style={styles.dateText}>{currentDate}</Text>
            </View>
            <View style={[styles.statusBadge, isActive && styles.statusBadgeActive]}>
              <View style={[styles.statusDot, !isActive && styles.statusDotInactive]} />
              <Text style={[styles.statusText, isActive && styles.statusTextActive]}>
                {isActive ? t.active : t.inactive}
              </Text>
            </View>
          </View>

          {/* Go Active/Inactive Button */}
          <Button1
            text={isActive ? t.goInactive : t.goActive}
            width="100%"
            onPress={handleGoActive}
            backgroundColor={isActive ? '#FF6600' : '#4A90F2'}
            height={39}
            containerStyle={styles.goActiveButton}
            textStyle={styles.goActiveButtonText}
          />
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksSection}>
          <Text style={styles.tasksTitle}>{t.tasks}</Text>
            <Text style={styles.tasksNote}>{t.tasksNote}</Text>

          {/* Loading state while tasks/video are being fetched after Go Active */}
          {isActive && tasksLoading && (
            <CartBox
              width="100%"
              borderRadius={12}
             
              backgroundColor={colors.secondary}
              marginBottom={16}
              paddingTop={12}
              paddingBottom={12}
              alignItems="center"
              justifyContent="center"
            >
              <View style={styles.tasksLoadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.tasksLoadingText}>Loading...</Text>
              </View>
            </CartBox>
          )}
          
          {isActive && !tasksLoading && userTasks.length === 0 && (
          <CartBox
            width="100%"
            borderRadius={12}
            borderWidth={1}
            borderColor={colors.border}
            height={39}
          >
              <Text style={styles.tasksMessage}>
                {allAssignedTasks.length > 0 && allTasksResponded ? t.allCaughtUp : t.noTasksToday}
              </Text>
            </CartBox>
          )}

          {/* Display Threat Alerts */}
          {isActive && !tasksLoading && userTasks.length > 0 && userTasks.map((task) => {
            // Debug: Log threat level
            //console.log('Task threat level:', task.threatLevel, 'for task:', task.taskId);
            // Format date to match: "2024-01-15 14:12:45"
            const threatDate = new Date(task.createdAt);
            const year = threatDate.getFullYear();
            const month = String(threatDate.getMonth() + 1).padStart(2, '0');
            const day = String(threatDate.getDate()).padStart(2, '0');
            const hours = String(threatDate.getHours()).padStart(2, '0');
            const minutes = String(threatDate.getMinutes()).padStart(2, '0');
            const seconds = String(threatDate.getSeconds()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            return (
              <CartBox
                key={task.taskId}
                width="100%"
                borderRadius={12}
                borderWidth={1}
                borderColor={colors.border}
                marginBottom={16}
                backgroundColor={colors.secondary}
              >
                <View style={styles.threatCard}>
                  {/* Threat Type */}
                  <Text style={styles.threatType}>{task.threatType}</Text>
                  
                  {/* Camera Name */}
                  <Text style={styles.cameraName}>{task.cameraName}</Text>
                  
                  {/* Location and Date Row */}
                  <View style={styles.locationDateRow}>
                    <View style={styles.locationRow}>
                      <Image 
                        source={require('../../assets/icons/location.png')} 
                        style={styles.locationIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.cameraLocation} numberOfLines={1} ellipsizeMode="tail">
                        {task.cameraLocation}
                      </Text>
                    </View>
                    <View style={styles.timeRow}>
                      <Image 
                        source={require('../../assets/icons/clock.png')} 
                        style={styles.clockIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.threatTime}>{formattedDate}</Text>
                    </View>
                  </View>

                  {/* Video Thumbnail */}
                  <TouchableOpacity
                    style={styles.videoContainer}
                    onPress={() => {
                      router.push({
                        pathname: '/camera-view',
                        params: {
                          cameraId: task.cameraId,
                          cameraName: task.cameraName,
                          cameraView: task.cameraView || '',
                          cameraLocation: task.cameraLocation || '',
                          cameraStatus: 'true',
                        },
                      });
                    }}
                    activeOpacity={0.8}>
                    {thumbnailLoading[task.taskId] ? (
                      <View style={styles.videoThumbnail}>
                        <ActivityIndicator size="small" color={colors.primary} />
                      </View>
                    ) : thumbnails[task.taskId] ? (
                      <Image
                        source={{ uri: thumbnails[task.taskId] || '' }}
                        style={styles.videoThumbnail}
                        resizeMode="cover"
                      />
                    ) : (
                      <Video
                        source={require('../../assets/images/foodcity_vedio.mp4')}
                        style={styles.videoThumbnail}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        isMuted={true}
                        isLooping={false}
                      />
                    )}
                    <View style={styles.playIconContainer}>
                      <Text style={styles.playIcon}>▶</Text>
                    </View>
                    {/* Threat Level Badge */}
                    <View style={[styles.threatLevelBadge, { backgroundColor: getThreatLevelColor(task.threatLevel) }]}>
                      <Text style={styles.threatLevelText} numberOfLines={1}>
                        {formatThreatLevel(task.threatLevel)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Question */}
                  <Text style={styles.threatQuestion}>
                    {t.threatQuestion}
                  </Text>

                  {/* Alert Response Button */}
                  <Button1
                    text={t.alertResponse}
                    width='auto'
                    onPress={() => {
                      setSelectedTaskId(task.taskId);
                      setAlertType('true');
                      setSelectedOption('');
                      setCustomInput('');
                      setShowAlertResponseModal(true);
                    }}
                    backgroundColor={colors.primary}
                    height={39}
                    containerStyle={styles.alertResponseButton}
                    textStyle={styles.alertResponseButtonText}
                  />
                </View>
          </CartBox>
            );
          })}
        </View>
      </ScrollView>
      <Footer />

      {/* Confirm Active Status Popup */}
      <Popup
        visible={showConfirmPopup}
        onClose={handleCancelActive}
        title={t.confirmActiveStatus}
        titleStyle={styles.popupTitle}
        popupStyle={styles.popupBox}
        dismissOnOverlayPress={false}>
        <Text style={styles.popupMessage}>
          {t.confirmActiveMessage}
        </Text>
        
        <View style={styles.popupButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelActive}
            activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>{t.noCancel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmActive}
            activeOpacity={0.7}>
            <Text style={styles.confirmButtonText}>{t.yesGoActive}</Text>
          </TouchableOpacity>
        </View>
      </Popup>

      {/* Confirm Inactive Status Popup */}
      <Popup
        visible={showConfirmInactivePopup}
        onClose={handleCancelInactive}
        title={t.confirmInactiveStatus}
        titleStyle={styles.popupTitle}
        popupStyle={styles.popupBox}
        dismissOnOverlayPress={false}>
        <Text style={styles.popupMessage}>
          {t.confirmInactiveMessage}
        </Text>
        
        <View style={styles.popupButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelInactive}
            activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>No, cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmInactiveButton}
            onPress={handleConfirmInactive}
            activeOpacity={0.7}>
            <Text style={styles.confirmInactiveButtonText}>{t.yesGoInactive}</Text>
          </TouchableOpacity>
        </View>
      </Popup>

      {/* Alert Response Modal */}
      <Modal
        visible={showAlertResponseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAlertResponseModal(false)}>
        <Pressable 
          style={styles.alertModalOverlay}
          onPress={() => setShowAlertResponseModal(false)}>
          <Pressable style={styles.alertModalContent} onPress={(e) => e.stopPropagation()}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />
            
            {/* Title */}
            <Text style={styles.alertModalTitle}>{t.alertResponseTitle}</Text>
            
            {/* True/False Alert Toggle */}
            <View style={styles.alertTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.alertTypeButton,
                  alertType === 'true' && styles.alertTypeButtonActive
                ]}
                onPress={() => {
                  setAlertType('true');
                  setSelectedOption('');
                  setCustomInput('');
                }}>
                <Text style={[
                  styles.alertTypeButtonText,
                  alertType === 'true' && styles.alertTypeButtonTextActive
                ]}>
                  {t.trueAlert}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.alertTypeButton,
                  alertType === 'false' && styles.alertTypeButtonActive
                ]}
                onPress={() => {
                  setAlertType('false');
                  setSelectedOption('');
                  setCustomInput('');
                }}>
                <Text style={[
                  styles.alertTypeButtonText,
                  alertType === 'false' && styles.alertTypeButtonTextActive
                ]}>
                  {t.falseAlert}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Options Section */}
            <Text style={styles.optionsHeading}>
              {t.ifAlertIs} {alertType.toUpperCase()}
            </Text>

            <ScrollView style={styles.optionsScrollView} showsVerticalScrollIndicator={false}>
              {(alertType === 'true' ? [
                t.trueOption1,
                t.trueOption2,
                t.trueOption3,
                t.trueOption4,
                t.trueOption5,
                t.other
              ] : [
                t.falseOption1,
                t.falseOption2,
                t.falseOption3,
                t.falseOption4,
                t.falseOption5,
                t.other
              ]).map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    selectedOption === option && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    if (option === t.other) {
                      setSelectedOption(t.other);
                    } else {
                      setSelectedOption(option);
                      setCustomInput('');
                    }
                  }}>
                  <Text style={[
                    styles.optionText,
                    selectedOption === option && styles.optionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Custom Input for "Other" */}
              {selectedOption === t.other && (
                <View style={styles.customInputContainer}>
                  <View style={styles.customInputWrapper}>
                    <Text style={styles.customInputLabel}>{t.sendMessage}</Text>
                    <TextInput
                      style={styles.customInput}
                      placeholder={t.typeHere}
                      value={customInput}
                      onChangeText={setCustomInput}
                      multiline
                      numberOfLines={4}
                      placeholderTextColor={colors.subtext}
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Next Button */}
            <Button1
              text={t.next}
              width="100%"
              onPress={() => {
                if (selectedOption || (selectedOption === t.other && customInput.trim())) {
                  setShowSendReportPopup(true);
                  // Don't hide modal, keep it visible
                }
              }}
              backgroundColor={colors.primary}
              height={39}
              containerStyle={styles.nextButton}
              textStyle={styles.nextButtonText}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Send Report Confirmation Popup */}
      <Popup
        visible={showSendReportPopup}
        onClose={() => {
          setShowSendReportPopup(false);
          // Keep modal open when popup is closed
        }}
        title={t.sendReportTitle}
        titleStyle={styles.confirmPopupTitle}
        popupStyle={styles.confirmPopupBox}
        dismissOnOverlayPress={false}>
        <Text style={styles.confirmPopupMessage}>
          {t.sendReportMessage}
        </Text>
        
        <View style={styles.confirmPopupButtons}>
          <TouchableOpacity
            style={styles.confirmCancelButton}
            onPress={() => setShowSendReportPopup(false)}
            activeOpacity={0.7}>
            <Text style={styles.confirmCancelButtonText}>{t.no}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmYesButton}
            onPress={async () => {
              // Find the task details
              const task = userTasks.find(t => t.taskId === selectedTaskId);
              if (!task) return;

              // Get current time and date
              const now = new Date();
              const responseTime = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });
              const responseDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

              // Create response object with all details
              const response: AlertResponse = {
                id: `response_${Date.now()}`,
                responseTime: responseTime,
                responseDate: responseDate,
                taskId: task.taskId,
                threatId: task.threatId,
                threatType: task.threatType,
                threatLevel: task.threatLevel,
                cameraId: task.cameraId,
                cameraName: task.cameraName,
                cameraLocation: task.cameraLocation,
                cameraView: task.cameraView,
                threatCreatedAt: task.createdAt,
                alertType: alertType,
                selectedOption: selectedOption,
                customInput: selectedOption === t.other ? customInput : '',
                fullResponse: selectedOption === t.other ? customInput : selectedOption,
                userId: userId
              };

              console.log('Alert Response:', response);

              // Save to Database - Update task with report_message
              try {
                if (!selectedTaskId || !userId) {
                  throw new Error('Task ID or User ID is missing');
                }

                // Create report message entry for database
                const reportMessageEntry: ReportMessageEntry = {
                  user_id: userId,
                  message: response.fullResponse,
                  reviewed_time: now.toISOString(), // ISO date string
                };

                // Update task in database with review_status = true and report_message
                await updateTask(
                  selectedTaskId,
                  true, // review_status = true
                  [reportMessageEntry] // report_message array
                );
                console.log('Task updated in database with report message');

                // Send notification to all admin users about the response
                try {
                  // Get all admin users
                  const adminUsers = await getUsersByRole('admin');
                  
                  if (adminUsers.length > 0) {
                    const adminUserIds = adminUsers.map(admin => admin.id);
                    const employeeName = userName || 'Employee';
                    const responsePreview = response.fullResponse.length > 50 
                      ? response.fullResponse.substring(0, 50) + '...' 
                      : response.fullResponse;
                    
                    const notificationTitle = 'Alert Response Received';
                    const notificationBody = `${employeeName} responded to ${task.threatType} at ${task.cameraName}: ${responsePreview}`;

                    await sendNotificationToUsers(
                      adminUserIds,
                      notificationTitle,
                      notificationBody,
                      {
                        type: 'alert_response',
                        task_id: task.taskId,
                        threat_id: task.threatId,
                        threat_type: task.threatType,
                        camera_name: task.cameraName,
                        camera_location: task.cameraLocation,
                        employee_id: userId,
                        employee_name: employeeName,
                        response: response.fullResponse,
                        alert_type: alertType,
                      }
                    );
                    
                    console.log(`Notification sent to ${adminUserIds.length} admin user(s) about response`);
                  }
                } catch (notificationError) {
                  console.error('Error sending notification to admins:', notificationError);
                  // Don't fail the response submission if notification fails
                }
              } catch (error) {
                console.error('Error updating task in database:', error);
                // Continue even if database update fails - still save to AsyncStorage
              }

              // Save to AsyncStorage (for local history)
              try {
                const existingHistory = await AsyncStorage.getItem('alertHistory');
                const historyArray: AlertResponse[] = existingHistory ? JSON.parse(existingHistory) : [];
                historyArray.unshift(response); // Add to beginning
                await AsyncStorage.setItem('alertHistory', JSON.stringify(historyArray));
                console.log('Response saved to history');
              } catch (error) {
                console.error('Error saving response to history:', error);
              }

              // Remove task from userTasks (filter out the responded task)
              const updatedTasks = userTasks.filter(t => t.taskId !== selectedTaskId);
              setUserTasks(updatedTasks);

              // Re-check if all assigned tasks have been responded to (use allAssignedTasks, not updatedTasks)
              await checkAllTasksResponded(userId, allAssignedTasks);

              // Close modals and reset
              setShowSendReportPopup(false);
              setShowAlertResponseModal(false);
              setSelectedTaskId(null);
              setAlertType('true');
              setSelectedOption('');
              setCustomInput('');
            }}
            activeOpacity={0.7}>
            <Text style={styles.confirmYesButtonText}>{t.yes}</Text>
          </TouchableOpacity>
        </View>
      </Popup>

      <Toast config={toastConfig} />
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
  welcomeSection: {
    marginBottom: 30,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontFamily: fonts.family.bold,
    fontWeight: fonts.weight.bold,
    color: colors.text,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },
  statusBadgeActive: {

    backgroundColor: '#E8F5E9',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusDotInactive: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 12,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color:colors.text,

  },
  statusTextActive: {
    color: '#4CAF50',
  },
  goActiveButton: {
    borderRadius: 12,
  },
  goActiveButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
  },
  tasksSection: {
  },
  tasksTitle: {
    fontSize: 16,
    fontFamily: fonts.family.bold,
    fontWeight: fonts.weight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  tasksNote: {
    fontSize: 12,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext2,
    marginBottom: 12,
  },
  tasksMessage: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext,
    alignSelf: 'center',
  },
  tasksLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tasksLoadingText: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext,
  },
  popupBox: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  popupTitle: {
    fontSize: fonts.size.l,
    fontFamily: fonts.family.bold,
    fontWeight: fonts.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  popupMessage: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  popupButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  confirmInactiveButton: {
    flex: 1,
    backgroundColor: '#FF6600',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmInactiveButtonText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  threatCard: {
    padding: 16,
  },
  threatType: {
    fontSize: 16,
    fontFamily: fonts.family.bold,
    fontWeight: 500,
    color: colors.text,
    marginBottom: 4,
  },
  cameraName: {
    fontSize: 16,
    fontFamily: fonts.family.medium,
    fontWeight: 400,
    color: colors.text,
    marginBottom: 8,
  },
  locationDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: colors.subtext,
  },
  cameraLocation: {
    fontSize: 12,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext,
    flex: 1,
    flexShrink: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  clockIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: colors.subtext,
  },
  threatTime: {
    fontSize: 12,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext,
  },
  videoContainer: {
    position: 'relative',
    width: 376,
    maxWidth: '100%',
    height: 178,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: colors.background,
    alignSelf: 'center',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholder: {
    fontSize: 14,
    color: colors.subtext,
    fontFamily: fonts.family.regular,
  },
  playIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 24,
    color: colors.primary,
    marginLeft: 3,
  },
  threatLevelBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    zIndex: 10,
    minWidth: 50,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  threatLevelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  threatQuestion: {
    fontSize: 16,
    fontFamily: fonts.family.regular,
    fontWeight: 400,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'left',
  },
  alertResponseButton: {
    borderRadius: 12,
  },
  alertResponseButtonText: {
    color: colors.secondary,
    fontSize: fonts.size.m,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
  },
  alertModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  alertModalContent: {
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 30,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  alertModalTitle: {
    fontSize: 16,
    fontFamily: fonts.family.bold,
    fontWeight: 600,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  alertTypeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  alertTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F2F4',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTypeButtonActive: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  alertTypeButtonText: {
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.subtext,
  },
  alertTypeButtonTextActive: {
    color: colors.primary,
  },
  optionsHeading: {
    fontSize: 16,
    fontFamily: fonts.family.bold,
    fontWeight: fonts.weight.bold,
    color: colors.text,
    marginBottom: 16,
  },
  optionsScrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  optionItemSelected: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.text,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
  },
  customInputContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  customInputWrapper: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  customInputLabel: {
    fontSize: 12,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.primary,
    marginBottom: 8,
  },
  customInput: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    fontSize: 14,
    fontFamily: fonts.family.regular,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  nextButton: {
    borderRadius: 12,
  },
  nextButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
  },
  confirmPopupTitle: {
    fontSize: 16,
    fontFamily: fonts.family.bold,
    fontWeight: fonts.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmPopupBox: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  confirmPopupMessage: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmPopupButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelButtonText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: '#6B7280',
  },
  confirmYesButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmYesButtonText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  headerWrapper: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 18,
    backgroundColor: colors.primary,
    borderRadius:15,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
    zIndex: 10,
  },
  notificationBadgeText: {
    color: colors.secondary,
    fontSize: 8,
    fontWeight: '600',
    fontFamily: fonts.family.medium,
    lineHeight: 12,
  },
});
