import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button1 } from '../../components/common/Button';
import CartBox from '../../components/common/CartBox';
import Header from '../../components/common/Header';
import Popup from '../../components/common/Popup';
import Footer from '../Footer';
import colors from '../../styles/Colors';
// @ts-ignore
import fonts from '../../styles/Fonts';

export default function EmployeeScreen() {
  const [userName, setUserName] = useState<string>('Employee');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showConfirmPopup, setShowConfirmPopup] = useState<boolean>(false);
  const [showConfirmInactivePopup, setShowConfirmInactivePopup] = useState<boolean>(false);

  useEffect(() => {
    // Get user data from AsyncStorage
    const loadUserData = async () => {
      try {
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
  }, []);

  const handleGoActive = () => {
    if (isActive) {
      // If already active, show inactive confirmation popup
      setShowConfirmInactivePopup(true);
    } else {
      // If inactive, show active confirmation popup
      setShowConfirmPopup(true);
    }
  };

  const handleConfirmActive = () => {
    setIsActive(true);
    setShowConfirmPopup(false);
    console.log('User went active');
  };

  const handleCancelActive = () => {
    setShowConfirmPopup(false);
    console.log('User cancelled going active');
  };

  const handleConfirmInactive = () => {
    setIsActive(false);
    setShowConfirmInactivePopup(false);
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
            height={50}
            containerStyle={styles.goActiveButton}
            textStyle={styles.goActiveButtonText}
          />
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksSection}>
          <Text style={styles.tasksTitle}>Tasks</Text>
          {!isActive && (
            <Text style={styles.tasksNote}>Only visible when you're Active.</Text>
          )}
          <CartBox
            width="100%"
            borderRadius={12}
            borderWidth={1}
            borderColor={colors.border}
            height={39}
            
          >
            <Text style={styles.tasksMessage}>No tasks — you're all caught up.</Text>
          </CartBox>
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
    marginRight: "35%",
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
});
