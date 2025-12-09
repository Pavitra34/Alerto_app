import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { findUserById } from '../../api/users';
import { findUserByEmail, findUserByUsername } from '../../api/auth';
import Header from '../../components/common/Header';
import CartBox from '../../components/common/CartBox';
import { Button1 } from '../../components/common/Button';
import Popup from '../../components/common/Popup';
import Toast, { showSuccessToast, toastConfig } from '../../components/common/Toast';
import Footer from '../Footer';
import colors from '../../styles/Colors';
// @ts-ignore
import fonts from '../../styles/Fonts';

export default function ProfileScreen() {
  const router = useRouter();
  const [fullname, setFullname] = useState<string>('Kishana');
  const [email, setEmail] = useState<string>('example@gmail.com');
  const [phoneNumber, setPhoneNumber] = useState<string>('07755112445');
  const [userId, setUserId] = useState<string>('');
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [showLogoutPopup, setShowLogoutPopup] = useState<boolean>(false);
  const [showAvatarPopup, setShowAvatarPopup] = useState<boolean>(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);

  const languages = [
    {
      id: 'deutsch',
      name: 'Deutsch',
      subtitle: 'German',
      flagImage: require('../../assets/icons/german.png'),
    },
    {
      id: 'english',
      name: 'English',
      subtitle: 'English (UK)',
      flagImage: require('../../assets/icons/english.png'),
    },
  ];

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId') || '';
        setUserId(storedUserId);

        if (storedUserId) {
          const user = findUserById(storedUserId);
          if (user) {
            setFullname(user.fullname);
            setPhoneNumber(user.phonenumber.toString());
          }
        }

        const userObjString = await AsyncStorage.getItem('userObj');
        if (userObjString) {
          const userObj = JSON.parse(userObjString);
          if (userObj.email) {
            const authUser = findUserByEmail(userObj.email) || findUserByUsername(userObj.email);
            if (authUser) {
              setEmail(authUser.email);
            }
          }
          if (userObj.fullname) {
            setFullname(userObj.fullname);
          }
        }

        // Load selected language
        const storedLangId = await AsyncStorage.getItem('langId') || 'en';
        const langId = storedLangId === 'de' ? 'deutsch' : 'english';
        setSelectedLanguage(langId);

        // Load selected avatar
        const storedAvatar = await AsyncStorage.getItem('selectedAvatar');
        if (storedAvatar) {
          setCurrentAvatar(storedAvatar);
          console.log('Loaded avatar from storage:', storedAvatar);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadUserData();
  }, []);

  const handleBack = async () => {
    try {
      // Get langId and userId from AsyncStorage to pass as params
      const langId = await AsyncStorage.getItem('langId') || 'en';
      const userId = await AsyncStorage.getItem('userId') || '';
      
      // Navigate to employee/home screen with params
      router.replace({
        pathname: '/employee' as any,
        params: { langId, userId }
      } as any);
    } catch (error) {
      console.error('Error navigating to employee screen:', error);
      // Fallback navigation
      router.replace('/employee' as any);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleMenuPress = (menuItem: string) => {
    console.log(`${menuItem} pressed`);
    if (menuItem === 'Language') {
      setShowLanguageModal(true);
    } else if (menuItem === 'Help center') {
      router.push('/helpcenter');
    } else if (menuItem === 'About us') {
      router.push('/about');
    } else if (menuItem === 'Terms of Service') {
      router.push('/termsofservice');
    } else if (menuItem === 'Privacy policy') {
      router.push('/privacypolicy');
    }
    // Add navigation logic here for other menu items
  };

  const handleLanguageSelect = (langId: string) => {
    setSelectedLanguage(langId);
    console.log('Language selected:', langId);
  };

  const handleSelectLanguage = async () => {
    try {
      const langIdToSave = selectedLanguage === 'deutsch' ? 'de' : 'en';
      await AsyncStorage.setItem('langId', langIdToSave);
      setShowLanguageModal(false);
      console.log('Language saved:', langIdToSave);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const handleCloseLanguageModal = () => {
    setShowLanguageModal(false);
  };

  const handleLogout = () => {
    setShowLogoutPopup(true);
  };

  const handleConfirmLogout = async () => {
    try {
      // Get languageId before clearing storage
      const langId = await AsyncStorage.getItem('langId') || 'en';
      console.log('Logout - LanguageId to be passed:', langId);
      
      // Get current values before clearing
      const currentUserId = await AsyncStorage.getItem('userId');
      const currentToken = await AsyncStorage.getItem('authToken');
      console.log('Logout - Current userId:', currentUserId);
      console.log('Logout - Current token:', currentToken);
      
      // Clear userId and token, but keep languageId
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userObj');
      console.log('Logout - Cleared userId, authToken, and userObj');
      console.log('Logout - LanguageId preserved:', langId);
      
      // Navigate to login screen with languageId as parameter
      const navigationParams = {
        pathname: '/login' as any,
        params: { langId: langId }
      };
      console.log('Logout - Navigating to login with params:', navigationParams);
      router.replace(navigationParams as any);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still navigate even if clearing storage fails
      router.replace('/login');
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutPopup(false);
  };

  const handleAvatarSelect = (avatarType: string) => {
    setSelectedAvatar(avatarType);
    console.log('Avatar selected:', avatarType);
  };

  const handleSaveAvatar = async () => {
    try {
      if (selectedAvatar) {
        // Save selected avatar to AsyncStorage
        await AsyncStorage.setItem('selectedAvatar', selectedAvatar);
        setCurrentAvatar(selectedAvatar);
        console.log('Avatar saved:', selectedAvatar);
        setShowAvatarPopup(false);
        setSelectedAvatar(null);
        // Show success toast
        showSuccessToast('Avatar added successfully');
      }
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  const handleCloseAvatarPopup = () => {
    setShowAvatarPopup(false);
    setSelectedAvatar(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        left={{
          type: 'image',
          url: require('../../assets/icons/arrow.png'),
          width: 24,
          height: 24,
          onPress: handleBack,
        }}
        center={{
          type: 'text',
          value: 'Profile',
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {currentAvatar ? (
                <Image 
                  source={currentAvatar === 'boy' 
                    ? require('../../assets/images/boy.png')
                    : require('../../assets/images/girl.png')} 
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{getInitials(fullname)}</Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={() => {
                // Set current avatar as selected when opening modal
                if (currentAvatar) {
                  setSelectedAvatar(currentAvatar);
                }
                setShowAvatarPopup(true);
              }}>
              <View style={styles.editIconCircle}>
                <Image 
                  source={require('../../assets/icons/edit.png')} 
                  style={styles.editIconImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* All Fields and Menu Items */}
        <View style={styles.allItemsSection}>
          <CartBox
            width="100%"
            backgroundColor={colors.background}
            borderRadius={12}
            borderWidth={0}
            borderColor={colors.border}
            height={59}
            marginBottom={12}
            alignItems="flex-start"
            justifyContent="flex-start">
            <View style={styles.infoRow}>
              <Image 
                source={require('../../assets/icons/fullname.png')} 
                style={styles.infoIconImage}
                resizeMode="contain"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Fullname</Text>
                <Text style={styles.infoValue}>{fullname}</Text>
              </View>
            </View>
          </CartBox>

          <CartBox
            width="100%"
            backgroundColor={colors.background}
            borderRadius={12}
            borderWidth={0}
            borderColor={colors.border}
            height={59}
            marginBottom={12}
            alignItems="flex-start"
            justifyContent="flex-start">
            <View style={styles.infoRow}>
              <Image 
                source={require('../../assets/icons/email.png')} 
                style={styles.infoIconImage}
                resizeMode="contain"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>
            </View>
          </CartBox>

          <CartBox
            width="100%"
            backgroundColor={colors.background}
            borderRadius={12}
            borderWidth={0}
            borderColor={colors.border}
            height={59}
            marginBottom={12}
            alignItems="flex-start"
            justifyContent="flex-start">
            <View style={styles.infoRow}>
              <Image 
                source={require('../../assets/icons/phone.png')} 
                style={styles.infoIconImage}
                resizeMode="contain"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone number</Text>
                <Text style={styles.infoValue}>{phoneNumber}</Text>
              </View>
            </View>
          </CartBox>

          <CartBox
            width="100%"
            backgroundColor={colors.background}
            borderRadius={12}
            borderWidth={0}
            borderColor={colors.border}
            height={41}
            marginBottom={12}
            onPress={() => handleMenuPress('Language')}>
            <View style={styles.menuRow}>
              <Image 
                source={require('../../assets/icons/lang.png')} 
                style={styles.menuIconImage}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Language</Text>
            </View>
          </CartBox>

          <CartBox
            width="100%"
            backgroundColor={colors.background}
            borderRadius={12}
            borderWidth={0}
            borderColor={colors.border}
            height={41}
            marginBottom={12}
            onPress={() => handleMenuPress('Help center')}>
            <View style={styles.menuRow}>
              <Image 
                source={require('../../assets/icons/hc.png')} 
                style={styles.menuIconImage}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Help center</Text>
            </View>
          </CartBox>

          <CartBox
            width="100%"
            backgroundColor={colors.background}
            borderRadius={12}
            borderWidth={0}
            borderColor={colors.border}
            height={41}
            marginBottom={12}
            onPress={() => handleMenuPress('About us')}>
            <View style={styles.menuRow}>
              <Image 
                source={require('../../assets/icons/au.png')} 
                style={styles.menuIconImage}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>About us</Text>
            </View>
          </CartBox>

          <CartBox
            width="100%"
            backgroundColor={colors.background}
            borderRadius={12}
            borderWidth={0}
            borderColor={colors.border}
            height={41}
            marginBottom={12}
            onPress={() => handleMenuPress('Privacy policy')}>
            <View style={styles.menuRow}>
              <Image 
                source={require('../../assets/icons/pp.png')} 
                style={styles.menuIconImage}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Privacy policy</Text>
            </View>
          </CartBox>

          <CartBox
            width="100%"
            backgroundColor={colors.background}
            borderRadius={12}
            borderWidth={0}
            borderColor={colors.border}
            height={41}
            marginBottom={12}
            onPress={() => handleMenuPress('Terms of Service')}>
            <View style={styles.menuRow}>
              <Image 
                source={require('../../assets/icons/ts.png')} 
                style={styles.menuIconImage}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Terms of Service</Text>
            </View>
          </CartBox>

          <CartBox
            width="100%"
            backgroundColor={colors.background}
            borderRadius={12}
            borderWidth={0}
            borderColor={colors.border}
            height={41}
            marginBottom={12}
            onPress={handleLogout}>
            <View style={styles.menuRow}>
              <Image 
                source={require('../../assets/icons/logout.png')} 
                style={[styles.menuIconImage, styles.logoutIconImage]}
                resizeMode="contain"
              />
              <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            </View>
          </CartBox>
        </View>
      </ScrollView>
      <Footer />

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseLanguageModal}>
        <Pressable 
          style={styles.modalOverlay}
          onPress={handleCloseLanguageModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />
            
            {/* Title */}
            <Text style={styles.modalTitle}>Language</Text>
            
            {/* Language Options */}
            <View style={styles.languageOptions}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.languageOption,
                    selectedLanguage === lang.id && styles.languageOptionSelected,
                  ]}
                  onPress={() => handleLanguageSelect(lang.id)}>
                  <Image 
                    source={lang.flagImage} 
                    style={styles.flagImage}
                    resizeMode="contain"
                  />
                  <View style={styles.languageTextContainer}>
                    <Text style={[
                      styles.languageName,
                      selectedLanguage === lang.id &&
                      {
                        color: colors.text,
                      }
                    ]}>
                      {lang.name}
                    </Text>
                    <Text style={[
                      styles.languageSubtitle,
                      selectedLanguage === lang.id && styles.languageSubtitleSelected,
                    ]}>
                      {lang.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Select Button */}
            <Button1
              text="Select"
              width="100%"
              onPress={handleSelectLanguage}
              backgroundColor={colors.primary}
              height={39}
              containerStyle={styles.selectButton}
              textStyle={styles.selectButtonText}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Logout Confirmation Popup */}
      <Popup
        visible={showLogoutPopup}
        onClose={handleCancelLogout}
        title="Logout?"
        titleStyle={styles.popupTitle}
        popupStyle={styles.popupBox}
        dismissOnOverlayPress={false}>
        <Text style={styles.popupMessage}>
        Confirm the logging out by clicking “yes”.
        </Text>
        
        <View style={styles.popupButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelLogout}
            activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>No</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmLogoutButton}
            onPress={handleConfirmLogout}
            activeOpacity={0.7}>
            <Text style={styles.confirmLogoutButtonText}>Yes</Text>
          </TouchableOpacity>
        </View>
      </Popup>

      {/* Avatar Selection Modal */}
      <Modal
        visible={showAvatarPopup}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseAvatarPopup}>
        <Pressable 
          style={styles.modalOverlay}
          onPress={handleCloseAvatarPopup}>
          <Pressable style={styles.avatarModalContent} onPress={(e) => e.stopPropagation()}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />
            
            {/* Title */}
            <Text style={styles.modalTitle}>Select Profile Avatar</Text>
            
            {/* Description */}
            <Text style={styles.avatarModalMessage}>
              Select one of the available avatar images for your profile.
            </Text>
            
            {/* Avatar Options */}
            <View style={styles.avatarOptions}>
              <TouchableOpacity
                style={[
                  styles.avatarOption,
                  selectedAvatar === 'boy' && styles.avatarOptionSelected
                ]}
                onPress={() => handleAvatarSelect('boy')}
                activeOpacity={0.7}>
                <Image 
                  source={require('../../assets/images/boy.png')} 
                  style={styles.avatarOptionImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.avatarOption,
                  selectedAvatar === 'girl' && styles.avatarOptionSelected
                ]}
                onPress={() => handleAvatarSelect('girl')}
                activeOpacity={0.7}>
                <Image 
                  source={require('../../assets/images/girl.png')} 
                  style={styles.avatarOptionImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>

            {/* Save Button */}
            <Button1
              text="Save"
              width="100%"
              onPress={handleSaveAvatar}
              backgroundColor={colors.primary}
              height={39}
              containerStyle={styles.saveAvatarButton}
              textStyle={styles.saveAvatarButtonText}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 32,
    fontFamily: fonts.family.bold,
    fontWeight: fonts.weight.bold,
    color: colors.secondary,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.secondary,
  },
  editIconText: {
    fontSize: 16,
    color: colors.secondary,
  },
  editIconImage: {
    width: 16,
    height: 16,
  },
  allItemsSection: {
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  infoIconImage: {
    width: 16,
    height: 16,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: "400",
    color: colors.text,
    marginBottom: 4,
    marginTop: 8,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.subtext,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  menuIcon: {
    fontSize: 20,
  
    color: colors.text,
  },
  menuIconImage: {
    width: 17,
    height: 17,
   
    paddingHorizontal: 20,
  },
  menuIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuIconCircleText: {
    fontSize: 14,
    fontFamily: fonts.family.bold,
    fontWeight: fonts.weight.bold,
    color: colors.secondary,
  },
  logoutIconImage: {
    tintColor: '#EF4444',
  },
  menuText: {
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.text,
    flex: 1,
  },
  logoutIcon: {
    color: '#EF4444',
  },
  logoutText: {
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
  
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 30,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  avatarModalContent: {
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 30,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  avatarModalMessage: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.text,
    textAlign: 'left',
    marginBottom: 24,
    lineHeight: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.family.bold,
    fontWeight: fonts.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  languageOptions: {
    marginBottom: 24,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    paddingTop: 12,
    height: 56,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languageOptionSelected: {
    borderColor: colors.primary,

  },
  flagImage: {
    width: 17,
    height: 17,
    marginRight: 12,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  languageName: {
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: "400",
    color: colors.text,
    
  },

  languageSubtitle: {
    fontSize: 12,
    fontFamily: fonts.family.regular,
    fontWeight: "400",
    color: colors.subtext,
  },
  languageSubtitleSelected: {
    color: colors.text,
  },
  selectButton: {
    borderRadius: 12,
  },
  selectButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
  },
  popupBox: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderColor:"#FF3B30",
   
  },
  popupTitle: {
    fontSize: 14,
    fontFamily: "400",
    fontWeight: "400",
    color: "#FF3B30",
    textAlign: 'center',
    marginBottom: 16,
  },
  popupMessage: {
    fontSize: 12,
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
  confirmLogoutButton: {
    flex: 1,
    backgroundColor:colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLogoutButtonText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  avatarOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    gap: 20,
  },
  avatarOption: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
  },
  saveAvatarButton: {
    borderRadius: 12,
  },
  saveAvatarButtonText: {
    color: colors.secondary,
    fontSize: fonts.size.m,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
  },
});
