import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { findCameraById } from '../../api/Camera';
import { findTasksByUserId, ReportMessageEntry } from '../../api/Tasks';
import { findThreatById } from '../../api/Threat';
import CartBox from '../../components/common/CartBox';
import Header from '../../components/common/Header';
import colors from '../../styles/Colors';
import Footer from '../Footer';
// @ts-ignore
import { getTranslations } from '../../assets/Translation';
import fonts from '../../styles/Fonts';

interface AlertResponse {
  id: string;
  responseTime: string;
  responseDate: string; // Current date when response was made (YYYY-MM-DD)
  taskId: string;
  threatId: string;
  threatType: string;
  threatLevel?: string; // Optional for backward compatibility
  cameraId: string;
  cameraName: string;
  cameraLocation: string;
  cameraView: string;
  threatCreatedAt: string;
  alertType: 'true' | 'false';
  selectedOption: string;
  customInput: string;
  fullResponse: string;
  userId: string;
}

export default function HistoryScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [langId, setLangId] = useState<string>('en');
  const [userId, setUserId] = useState<string>('');
  const [alertHistory, setAlertHistory] = useState<AlertResponse[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [t, setT] = useState(getTranslations('en'));
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});
  const [thumbnailLoading, setThumbnailLoading] = useState<Record<string, boolean>>({});

  // Load reviewed tasks from database
  const loadReviewedTasks = async (currentUserId: string) => {
    try {
      // Get all tasks for this user
      const allTasks = await findTasksByUserId(currentUserId);
      
      // Strictly filter tasks where:
      // 1. review_status = true (task has been reviewed)
      // 2. user_id is in user_ids array (task is assigned to this user)
      // 3. report_message exists and contains a message from this user
      const reviewedTasks = allTasks.filter(task => {
        // Check review_status is true
        if (task.review_status !== true) {
          return false;
        }
        
        // Check user_id is in user_ids array
        if (!task.user_ids || !task.user_ids.includes(currentUserId)) {
          return false;
        }
        
        // Check if this user has a report message
        const userReport = task.report_message?.find((msg: ReportMessageEntry) => msg.user_id === currentUserId);
        if (!userReport || !userReport.message) {
          return false;
        }
        
        return true;
      });
      
      if (reviewedTasks.length === 0) {
        setAlertHistory([]);
        return;
      }

      // For each reviewed task, get threat and camera details
      const historyPromises = reviewedTasks.map(async (task) => {
        try {
          const threat = await findThreatById(task.threat_id);
          if (!threat) return null;

          const camera = await findCameraById(threat.camera_id);
          if (!camera) return null;

          // Get the report message for this user from the task
          const userReport = task.report_message?.find((msg: ReportMessageEntry) => msg.user_id === currentUserId);
          
          // If no report message found, skip this task
          if (!userReport || !userReport.message) {
            return null;
          }
          
          // Format reviewed_time
          const reviewedTime = userReport.reviewed_time ? new Date(userReport.reviewed_time) : new Date(task.updatedat);
          const responseTime = reviewedTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          const responseDate = reviewedTime.toISOString().split('T')[0];

          // Determine alert type from message (if it contains "true" or "false" keywords)
          // This is a simple heuristic - you might need to adjust based on your actual message format
          const message = userReport.message;
          const alertType: 'true' | 'false' = message.toLowerCase().includes('false') ? 'false' : 'true';

          const historyItem: AlertResponse = {
            id: task._id,
            responseTime: responseTime,
            responseDate: responseDate,
            taskId: task._id,
            threatId: threat._id,
            threatType: threat.threat_type,
            threatLevel: threat.threat_level,
            cameraId: camera._id,
            cameraName: camera.name,
            cameraLocation: camera.location,
            cameraView: camera.camera_view,
            threatCreatedAt: threat.createdat,
            alertType: alertType,
            selectedOption: message, // Use the message as selectedOption
            customInput: message.includes('Other') ? message : '',
            fullResponse: message,
            userId: currentUserId
          };

          return historyItem;
        } catch (error) {
          console.error('Error loading task details:', error);
          return null;
        }
      });

      const historyResults = await Promise.all(historyPromises);
      const validHistory = historyResults.filter((item): item is AlertResponse => item !== null);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayDateString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Filter to show only today's history
      const todayHistory = validHistory.filter((item) => {
        return item.responseDate === todayDateString;
      });
      
      // Sort by reviewed time (newest first)
      todayHistory.sort((a, b) => {
        const dateA = new Date(a.responseDate + ' ' + a.responseTime).getTime();
        const dateB = new Date(b.responseDate + ' ' + b.responseTime).getTime();
        return dateB - dateA;
      });

      setAlertHistory(todayHistory);
    } catch (error) {
      console.error('Error loading reviewed tasks:', error);
      setAlertHistory([]);
    }
  };

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  // Helper function to get YouTube thumbnail URL
  const getYouTubeThumbnail = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;
    
    // Use YouTube's thumbnail API
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Generate thumbnails for all history items
  useEffect(() => {
    const generateThumbnails = async () => {
      if (!alertHistory || alertHistory.length === 0) return;
      
      for (const response of alertHistory) {
        if (response.cameraView && !thumbnails[response.id]) {
          setThumbnailLoading((prev) => ({ ...prev, [response.id]: true }));
          try {
            // Check if it's a local video (foodcity_vedio)
            const isLocalVideo = response.cameraView === 'foodcity_vedio' ||
                                 (response.cameraView && response.cameraView.trim() === 'foodcity_vedio') ||
                                 (response.cameraView && response.cameraView.includes('foodcity_vedio') && !response.cameraView.includes('http'));
            
            if (isLocalVideo) {
              // For local videos, set thumbnail to null to show video placeholder
              setThumbnails((prev) => ({ ...prev, [response.id]: null }));
            } else {
              // Check if it's a YouTube URL
              const isYouTube = response.cameraView.includes('youtube.com') || response.cameraView.includes('youtu.be');
              
              if (isYouTube) {
                // Use YouTube thumbnail
                const youtubeThumbnail = getYouTubeThumbnail(response.cameraView);
                if (youtubeThumbnail) {
                  setThumbnails((prev) => ({ ...prev, [response.id]: youtubeThumbnail }));
                } else {
                  setThumbnails((prev) => ({ ...prev, [response.id]: null }));
                }
              } else {
                // For non-YouTube videos, use the URL directly
                setThumbnails((prev) => ({ ...prev, [response.id]: response.cameraView }));
              }
            }
          } catch (error) {
            console.error('Error generating thumbnail for history item:', response.id, error);
            setThumbnails((prev) => ({ ...prev, [response.id]: null }));
          } finally {
            setThumbnailLoading((prev) => ({ ...prev, [response.id]: false }));
          }
        } else if (!response.cameraView) {
          // If no cameraView, set thumbnail to null to show video placeholder
          setThumbnails((prev) => ({ ...prev, [response.id]: null }));
        }
      }
    };
    
    generateThumbnails();
  }, [alertHistory]);

  // Handle thumbnail press - navigate to full screen view
  const handleThumbnailPress = (response: AlertResponse) => {
    router.push({
      pathname: '/camera-view',
      params: {
        cameraId: response.cameraId,
        cameraName: response.cameraName,
        cameraView: response.cameraView || '',
        cameraLocation: response.cameraLocation || '',
        cameraStatus: 'true',
      },
    });
  };

  useEffect(() => {
    // Get params or load from AsyncStorage
    const loadData = async () => {
      try {
        const storedLangId = params.langId as string || await AsyncStorage.getItem('langId') || 'en';
        const storedUserId = params.userId as string || await AsyncStorage.getItem('userId') || '';
        
        setLangId(storedLangId);
        setUserId(storedUserId);
        setT(getTranslations(storedLangId));
        
        // Load reviewed tasks from database if userId is available
        if (storedUserId) {
          await loadReviewedTasks(storedUserId);
        }
      } catch (error) {
        console.error('Error loading history data:', error);
      }
    };

    loadData();
  }, [params.langId, params.userId]);

  // Refresh history when userId changes (but not when params change)
  useEffect(() => {
    if (!userId) return;
    loadReviewedTasks(userId);
  }, [userId]);

  // Update translations when langId changes
  useEffect(() => {
    setT(getTranslations(langId));
  }, [langId]);

  const loadHistory = async () => {
    try {
      if (!userId) return;
      await loadReviewedTasks(userId);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadHistory();
    } catch (error) {
      console.error('Error refreshing history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // Add notification navigation logic here
  };

  const getThreatLevelColor = (threatLevel?: string): string => {
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

  const formatThreatLevel = (level?: string): string => {
    if (!level) return 'High';
    const levelLower = level.toLowerCase();
    // Handle critical as high
    if (levelLower === 'critical') {
      return 'High';
    }
    // Capitalize first letter, lowercase rest
    return levelLower.charAt(0).toUpperCase() + levelLower.slice(1);
  };

  const formatThreatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
        <Header
          center={{
            type: 'text',
            value: t.history,
          }}
        />
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
        
        {alertHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t.noHistoryAvailable}</Text>
          </View>
        ) : (
          alertHistory.map((response) => (
            <View key={response.id} style={styles.historyItemContainer}>
              {/* Response Time at Top - Outside CartBox */}
              <View style={styles.responseTimeContainer}>
                <Image 
                  source={require('../../assets/icons/clock.png')} 
                  style={styles.responseTimeIcon}
                  resizeMode="contain"
                />
                <Text style={styles.responseTime}>{response.responseTime}</Text>
              </View>

              <CartBox
                width="100%"
                borderRadius={12}
                borderWidth={1}
                borderColor={colors.border}
                marginBottom={16}
                backgroundColor={colors.secondary}
              >
                <View style={styles.historyCard}>
                  {/* Threat Details */}
                <Text style={styles.threatType}>{response.threatType}</Text>
                
                {/* Camera Name */}
                <Text style={styles.cameraName}>{response.cameraName}</Text>
                
                {/* Location and Date Row */}
                <View style={styles.locationDateRow}>
                  <View style={styles.locationRow}>
                    <Image 
                      source={require('../../assets/icons/location.png')} 
                      style={styles.locationIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.cameraLocation} numberOfLines={1} ellipsizeMode="tail">
                      {response.cameraLocation}
                    </Text>
                  </View>
                  <View style={styles.timeRow}>
                    <Image 
                      source={require('../../assets/icons/clock.png')} 
                      style={styles.clockIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.threatTime}>{formatThreatDate(response.threatCreatedAt)}</Text>
                  </View>
                </View>

                {/* Video Thumbnail */}
                <TouchableOpacity
                  style={styles.videoContainer}
                  onPress={() => handleThumbnailPress(response)}
                  activeOpacity={0.8}>
                  {thumbnailLoading[response.id] ? (
                    <View style={styles.videoThumbnail}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : thumbnails[response.id] ? (
                    <Image
                      source={{ uri: thumbnails[response.id] || '' }}
                      style={styles.videoThumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.videoThumbnail}>
                      <Video
                        source={require('../../assets/images/foodcity_vedio.mp4')}
                        style={styles.videoThumbnail}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        isMuted={true}
                        isLooping={true}
                      />
                    </View>
                  )}
                  <View style={styles.playIconContainer}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                  {/* Threat Level Badge */}
                  <View style={[styles.threatLevelBadge, { backgroundColor: getThreatLevelColor(response.threatLevel) }]}>
                    <Text style={styles.threatLevelText}>
                      {formatThreatLevel(response.threatLevel)}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Action Report Section */}
                <View style={styles.actionReportContainer}>
                  <View style={styles.actionReportLeft}>
                    <Text style={styles.actionReportLabel}>{t.yourAction} {response.alertType === 'true' ? t.trueAlertLabel : t.falseAlertLabel}</Text>
                    <Text style={styles.actionReportText}>{t.report} {response.fullResponse}</Text>
                  </View>
                  <Text style={styles.actionReportTime}>{response.responseTime}</Text>
                </View>
              </View>
            </CartBox>
            </View>
          ))
        )}
      </ScrollView>

      <Footer />
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext,
  },
  historyItemContainer: {
    marginBottom: 16,
  },
  historyCard: {
    padding: 16,
  },
  responseTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseTimeIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: colors.subtext,
  },
  responseTime: {
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.text,
  },
  threatType: {
    fontSize: 16,
    fontFamily: fonts.family.bold,
    fontWeight: fonts.weight.semibold,
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
  actionReportContainer: {
    backgroundColor: '#6B7280',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 10,
    marginTop: 12,
    borderRadius: 10,
    height: "auto",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    },
  actionReportLeft: {
    flex: 1,
    justifyContent: 'center',

  },
  actionReportLabel: {
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
    marginTop: 0,
    
  },
  actionReportText: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.secondary,
    marginTop: 4,
  },
  actionReportTime: {
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
    marginLeft: 12,
    alignSelf: 'flex-end',
  },
});

