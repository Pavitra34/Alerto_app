import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import Header from '../../components/common/Header';
import CartBox from '../../components/common/CartBox';
import Footer from '../Footer';
import colors from '../../styles/Colors';
// @ts-ignore
import fonts from '../../styles/Fonts';

interface AlertResponse {
  id: string;
  responseTime: string;
  responseDate: string; // Current date when response was made (YYYY-MM-DD)
  taskId: string;
  threatId: string;
  threatType: string;
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
  const [langId, setLangId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [alertHistory, setAlertHistory] = useState<AlertResponse[]>([]);

  useEffect(() => {
    // Get params or load from AsyncStorage
    const loadData = async () => {
      try {
        const storedLangId = params.langId as string || await AsyncStorage.getItem('langId') || 'en';
        const storedUserId = params.userId as string || await AsyncStorage.getItem('userId') || '';
        
        setLangId(storedLangId);
        setUserId(storedUserId);
        
        // Load alert history only if userId is available
        if (storedUserId) {
          const historyData = await AsyncStorage.getItem('alertHistory');
          if (historyData) {
            const history: AlertResponse[] = JSON.parse(historyData);
            // Filter by userId
            const userHistory = history.filter(h => h.userId === storedUserId);
            
            // Filter to show only today's history
            const today = new Date();
            const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            const todayHistory = userHistory.filter(h => {
              // Check if responseDate matches today (handle both old and new format)
              const responseDate = h.responseDate || new Date(h.threatCreatedAt).toISOString().split('T')[0];
              return responseDate === todayDateString;
            });
            
            setAlertHistory(todayHistory);
          } else {
            setAlertHistory([]);
          }
        }
        
        //console.log('History Screen - langId:', storedLangId, 'userId:', storedUserId);
      } catch (error) {
        console.error('Error loading history data:', error);
      }
    };

    loadData();
  }, [params.langId, params.userId]);

  // Refresh history when userId changes (but not when params change)
  useEffect(() => {
    if (!userId) return;

    const refreshHistory = async () => {
      try {
        const historyData = await AsyncStorage.getItem('alertHistory');
        if (historyData) {
          const history: AlertResponse[] = JSON.parse(historyData);
          const userHistory = history.filter(h => h.userId === userId);
          
          // Filter to show only today's history
          const today = new Date();
          const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          const todayHistory = userHistory.filter(h => {
            // Check if responseDate matches today (handle both old and new format)
            const responseDate = h.responseDate || new Date(h.threatCreatedAt).toISOString().split('T')[0];
            return responseDate === todayDateString;
          });
          
          setAlertHistory(todayHistory);
        } else {
          setAlertHistory([]);
        }
      } catch (error) {
        console.error('Error refreshing history:', error);
      }
    };

    refreshHistory();
  }, [userId]);

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // Add notification navigation logic here
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
      {/* Header */}
      <Header
        center={{
          type: 'text',
          value: 'History',
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {alertHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No history available</Text>
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
                <View style={styles.videoContainer}>
                  <View style={styles.videoThumbnail}>
                    <Text style={styles.videoPlaceholder}>Video Thumbnail</Text>
                  </View>
                  <View style={styles.playIconContainer}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                  {/* Threat Level Badge */}
                  <View style={styles.threatLevelBadge}>
                    <Text style={styles.threatLevelText}>High</Text>
                  </View>
                </View>

                {/* Action Report Section */}
                <View style={styles.actionReportContainer}>
                  <View style={styles.actionReportLeft}>
                    <Text style={styles.actionReportLabel}>Your action: {response.alertType === 'true' ? 'True Alert' : 'False Alert'}</Text>
                    <Text style={styles.actionReportText}>Report: {response.fullResponse}</Text>
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
    paddingTop: 20,
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
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  threatLevelText: {
    fontSize: 12,
    fontFamily: fonts.family.bold,
    fontWeight: 500,
    color: colors.secondary,
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

