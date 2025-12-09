import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { findTasksByUserId } from '../../api/Tasks';
import { findThreatById, findThreatsByType } from '../../api/Threat';
import { findCameraById } from '../../api/Camera';
import { Button1 } from '../../components/common/Button';
import CartBox from '../../components/common/CartBox';
import Header from '../../components/common/Header';
import Popup from '../../components/common/Popup';
import Toast, { showSuccessToast, toastConfig } from '../../components/common/Toast';
import Footer from '../Footer';
import colors from '../../styles/Colors';
// @ts-ignore
import fonts from '../../styles/Fonts';

interface TaskWithThreat {
  taskId: string;
  threatId: string;
  threatType: string;
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
  const [userName, setUserName] = useState<string>('Employee');
  const [userId, setUserId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showConfirmPopup, setShowConfirmPopup] = useState<boolean>(false);
  const [showConfirmInactivePopup, setShowConfirmInactivePopup] = useState<boolean>(false);
  const [userTasks, setUserTasks] = useState<TaskWithThreat[]>([]);
  const hasShownLoginToast = useRef<boolean>(false);
  const [showAlertResponseModal, setShowAlertResponseModal] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'true' | 'false'>('true');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [showSendReportPopup, setShowSendReportPopup] = useState<boolean>(false);

  useEffect(() => {
    // Check if we should show login success toast (only once per session)
    // Only show if params has showLoginSuccess and we haven't shown it yet
    if (params.showLoginSuccess === 'true' && !hasShownLoginToast.current) {
      // Use setTimeout to ensure it shows after screen is fully loaded
      setTimeout(() => {
        showSuccessToast('Login successful!');
        hasShownLoginToast.current = true;
      }, 500);
    }

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
  }, [params.showLoginSuccess]); // Only depend on showLoginSuccess param

  const handleGoActive = () => {
    if (isActive) {
      // If already active, show inactive confirmation popup
      setShowConfirmInactivePopup(true);
    } else {
      // If inactive, show active confirmation popup
      setShowConfirmPopup(true);
    }
  };

  const loadUserTasks = async () => {
    try {
      if (!userId) return;
      
      // Get tasks assigned to this user
      const tasks = findTasksByUserId(userId);
      
      // For each task, get threat and camera details
      const tasksWithDetails: TaskWithThreat[] = tasks.map(task => {
        const threat = findThreatById(task.threat_id);
        if (!threat) return null;
        
        const camera = findCameraById(threat.camera_id);
        if (!camera) return null;
        
        return {
          taskId: task._id,
          threatId: threat._id,
          threatType: threat.threat_type,
          cameraId: camera._id,
          cameraName: camera.name, // Get directly from Camera.ts
          cameraLocation: camera.location, // Get directly from Camera.ts
          cameraView: camera.camera_view, // Get video URL from Camera.ts
          createdAt: threat.createdat,
          reviewStatus: task.review_status,
        };
      }).filter((task): task is TaskWithThreat => task !== null);
      
      setUserTasks(tasksWithDetails);
      console.log('Loaded user tasks:', tasksWithDetails);
    } catch (error) {
      console.error('Error loading user tasks:', error);
    }
  };

  const handleConfirmActive = () => {
    setIsActive(true);
    setShowConfirmPopup(false);
    console.log('User went active');
    // Load tasks when user goes active
    loadUserTasks();
  };

  const handleCancelActive = () => {
    setShowConfirmPopup(false);
    console.log('User cancelled going active');
  };

  const handleConfirmInactive = () => {
    setIsActive(false);
    setShowConfirmInactivePopup(false);
    setUserTasks([]); // Clear tasks when going inactive
    console.log('User went inactive');
  };

  const handleCancelInactive = () => {
    setShowConfirmInactivePopup(false);
    console.log('User cancelled going inactive');
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // Add notification navigation logic here
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        center={{
          type: 'text',
          value: (showConfirmPopup || showConfirmInactivePopup) ? 'supermarket theft detection' : 'Alerto',
        }}
        right={{
          type: 'image',
          url: require('../../assets/icons/notification.png'),
          width: 24,
          height: 24,
          onPress: handleNotificationPress,
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeTitle}>Welcome, {userName}</Text>
              <Text style={styles.dateText}>{currentDate}</Text>
            </View>
            <View style={[styles.statusBadge, isActive && styles.statusBadgeActive]}>
              <View style={[styles.statusDot, !isActive && styles.statusDotInactive]} />
              <Text style={[styles.statusText, isActive && styles.statusTextActive]}>
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Go Active/Inactive Button */}
          <Button1
            text={isActive ? 'Go Inactive' : 'Go active'}
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
          <Text style={styles.tasksTitle}>Tasks</Text>
            <Text style={styles.tasksNote}>Only visible when you're Active.</Text>
          
          {isActive && userTasks.length === 0 && (
          <CartBox
            width="100%"
            borderRadius={12}
            borderWidth={1}
            borderColor={colors.border}
            height={39}
          >
              <Text style={styles.tasksMessage}>No assign tasks today</Text>
            </CartBox>
          )}

          {/* Display Threat Alerts */}
          {isActive && userTasks.length > 0 && userTasks.map((task) => {
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

                  {/* Question */}
                  <Text style={styles.threatQuestion}>
                    Is this a true threat or a false threat?
                  </Text>

                  {/* Alert Response Button */}
                  <Button1
                    text="Alert Response"
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
        title="Confirm Active Status"
        titleStyle={styles.popupTitle}
        popupStyle={styles.popupBox}
        dismissOnOverlayPress={false}>
        <Text style={styles.popupMessage}>
          Are you sure you want to set your status to ACTIVE? This means you are currently working inside the shop.
        </Text>
        
        <View style={styles.popupButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelActive}
            activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>No, cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmActive}
            activeOpacity={0.7}>
            <Text style={styles.confirmButtonText}>Yes, go Active</Text>
          </TouchableOpacity>
        </View>
      </Popup>

      {/* Confirm Inactive Status Popup */}
      <Popup
        visible={showConfirmInactivePopup}
        onClose={handleCancelInactive}
        title="Confirm Inactive Status"
        titleStyle={styles.popupTitle}
        popupStyle={styles.popupBox}
        dismissOnOverlayPress={false}>
        <Text style={styles.popupMessage}>
          Are you sure you want to set your status to INACTIVE? This means you are not currently active inside the shop.
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
            <Text style={styles.confirmInactiveButtonText}>Yes, go Inactive</Text>
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
            <Text style={styles.alertModalTitle}>Alert Response</Text>
            
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
                  True alert
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
                  False alert
                </Text>
              </TouchableOpacity>
            </View>

            {/* Options Section */}
            <Text style={styles.optionsHeading}>
              If the Alert is {alertType.toUpperCase()}
            </Text>

            <ScrollView style={styles.optionsScrollView} showsVerticalScrollIndicator={false}>
              {(alertType === 'true' ? [
                "I saw the person stealing.",
                "I checked — the person was acting suspicious.",
                "I went there but the person ran away.",
                "I found the item they tried to steal.",
                "I informed security/police.",
                "Other"
              ] : [
                "I checked — nothing was happening.",
                "The customer was normal, not stealing.",
                "Camera gave a wrong alert.",
                "Shadow or movement triggered the alert.",
                "Too many people — but no problem found.",
                "Other"
              ]).map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    selectedOption === option && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    if (option === "Other") {
                      setSelectedOption('Other');
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
              {selectedOption === 'Other' && (
                <View style={styles.customInputContainer}>
                  <View style={styles.customInputWrapper}>
                    <Text style={styles.customInputLabel}>Send message</Text>
                    <TextInput
                      style={styles.customInput}
                      placeholder="Type here......"
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
              text="Next"
              width="100%"
              onPress={() => {
                if (selectedOption || (selectedOption === 'Other' && customInput.trim())) {
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
        title="Send Report to Admin?"
        titleStyle={styles.confirmPopupTitle}
        popupStyle={styles.confirmPopupBox}
        dismissOnOverlayPress={false}>
        <Text style={styles.confirmPopupMessage}>
          Are you sure you want to send this report to the admin? This action cannot be undone.
        </Text>
        
        <View style={styles.confirmPopupButtons}>
          <TouchableOpacity
            style={styles.confirmCancelButton}
            onPress={() => setShowSendReportPopup(false)}
            activeOpacity={0.7}>
            <Text style={styles.confirmCancelButtonText}>No</Text>
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
                cameraId: task.cameraId,
                cameraName: task.cameraName,
                cameraLocation: task.cameraLocation,
                cameraView: task.cameraView,
                threatCreatedAt: task.createdAt,
                alertType: alertType,
                selectedOption: selectedOption,
                customInput: selectedOption === 'Other' ? customInput : '',
                fullResponse: selectedOption === 'Other' ? customInput : selectedOption,
                userId: userId
              };

              console.log('Alert Response:', response);

              // Save to AsyncStorage
              try {
                const existingHistory = await AsyncStorage.getItem('alertHistory');
                const historyArray: AlertResponse[] = existingHistory ? JSON.parse(existingHistory) : [];
                historyArray.unshift(response); // Add to beginning
                await AsyncStorage.setItem('alertHistory', JSON.stringify(historyArray));
                console.log('Response saved to history');
              } catch (error) {
                console.error('Error saving response to history:', error);
              }

              // Remove task from userTasks
              setUserTasks(prevTasks => prevTasks.filter(t => t.taskId !== selectedTaskId));

              // Close modals and reset
              setShowSendReportPopup(false);
              setShowAlertResponseModal(false);
              setSelectedTaskId(null);
              setAlertType('true');
              setSelectedOption('');
              setCustomInput('');
            }}
            activeOpacity={0.7}>
            <Text style={styles.confirmYesButtonText}>Yes</Text>
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
    paddingTop: 20,
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
});
