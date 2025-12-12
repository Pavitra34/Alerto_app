import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTranslations } from '../../assets/Translation';
import { Button1 } from '../../components/common/Button';
import CartBox from '../../components/common/CartBox';
import Header from '../../components/common/Header';
import InputBox from '../../components/common/InputBox';
import Popup from '../../components/common/Popup';
import Toast, { showSuccessToast, toastConfig } from '../../components/common/Toast';
import colors from '../../styles/Colors';
import Footer_A from '../Footer_A';
// @ts-ignore
import fonts from '../../styles/Fonts';

export default function ProfileScreen() {
  const router = useRouter();
  const [fullname, setFullname] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [showLogoutPopup, setShowLogoutPopup] = useState<boolean>(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showEditFullnameModal, setShowEditFullnameModal] = useState<boolean>(false);
  const [showEditEmailModal, setShowEditEmailModal] = useState<boolean>(false);
  const [editingFullname, setEditingFullname] = useState<string>('');
  const [editingEmail, setEditingEmail] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [t, setT] = useState(getTranslations('en'));

  const loadLanguage = async () => {
    try {
      const storedLangId = await AsyncStorage.getItem('langId') || 'en';
      setT(getTranslations(storedLangId));
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  useEffect(() => {
    loadLanguage();
    // Reload language when screen is focused (e.g., returning from LanguageScreen)
    const interval = setInterval(() => {
      loadLanguage();
    }, 1000); // Check every second for language changes

    return () => clearInterval(interval);
  }, []);

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

  const loadUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId') || '';
      setUserId(storedUserId);

      // Get user data from AsyncStorage (saved during login from backend)
      const userObjString = await AsyncStorage.getItem('userObj');
      if (userObjString) {
        const userObj = JSON.parse(userObjString);
        
        // Set user data from backend response
        if (userObj.fullname) {
          setFullname(userObj.fullname);
        }
        if (userObj.email) {
          setEmail(userObj.email);
        }
      }

      // Load selected language
      const storedLangId = await AsyncStorage.getItem('langId') || 'en';
      const langId = storedLangId === 'de' ? 'deutsch' : 'english';
      setSelectedLanguage(langId);

      // Load selected avatar image URI
      const storedAvatarUri = await AsyncStorage.getItem('avatarImageUri');
      if (storedAvatarUri) {
        setAvatarUri(storedAvatarUri);
        console.log('Loaded avatar from storage:', storedAvatarUri);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserData();
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBack = async () => {
    try {
      // Get langId and userId from AsyncStorage to pass as params
      const langId = await AsyncStorage.getItem('langId') || 'en';
      const userId = await AsyncStorage.getItem('userId') || '';
      
      // Navigate to admin/home screen with params
      router.replace({
        pathname: '/admin' as any,
        params: { langId, userId }
      } as any);
    } catch (error) {
      console.error('Error navigating to admin screen:', error);
      // Fallback navigation
      router.replace('/admin' as any);
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
      // Reload translations immediately after language change
      setT(getTranslations(langIdToSave));
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
      
      // Get current values before clearing
      const currentUserId = await AsyncStorage.getItem('userId');
      const currentToken = await AsyncStorage.getItem('authToken');
      
      console.log('\n🚪 ========== LOGOUT ==========');
      console.log('👤 User ID:', currentUserId);
      console.log('🔑 Token (before removal):', currentToken);
      console.log('🌐 Language ID (preserved):', langId);
      
      // Clear all user-related data, but keep languageId
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userObj');
      await AsyncStorage.removeItem('userActiveStatus'); // Also clear active status
      
      // Verify token is removed
      const tokenAfterRemoval = await AsyncStorage.getItem('authToken');
      console.log('🔑 Token (after removal):', tokenAfterRemoval || '✅ Removed');
      console.log('✅ All user data cleared from AsyncStorage');
      console.log('===================================\n');
      
      // Navigate to login screen with languageId as parameter
      const navigationParams = {
        pathname: '/login' as any,
        params: { langId: langId }
      };
      router.replace(navigationParams as any);
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Still navigate even if clearing storage fails
      router.replace('/login');
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutPopup(false);
  };

  const handleEditAvatar = async () => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to select an image!'
        );
        return;
      }

      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        setAvatarUri(selectedImageUri);
        
        // Save image URI to AsyncStorage
        await AsyncStorage.setItem('avatarImageUri', selectedImageUri);
        console.log('Avatar saved:', selectedImageUri);
        
        // Show success toast
        showSuccessToast(t.imageAddedSuccessfully);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleEditFullname = () => {
    setEditingFullname(fullname);
    setShowEditFullnameModal(true);
  };

  const handleEditEmail = () => {
    setEditingEmail(email);
    setShowEditEmailModal(true);
  };

  const handleSaveFullname = async () => {
    if (editingFullname.trim()) {
      setFullname(editingFullname.trim());
      setShowEditFullnameModal(false);
      // Save to AsyncStorage if needed
      try {
        const userObjString = await AsyncStorage.getItem('userObj');
        if (userObjString) {
          const userObj = JSON.parse(userObjString);
          userObj.fullname = editingFullname.trim();
          await AsyncStorage.setItem('userObj', JSON.stringify(userObj));
        }
      } catch (error) {
        console.error('Error saving fullname:', error);
      }
      showSuccessToast(t.fullnameUpdatedSuccessfully);
    }
  };

  const handleSaveEmail = async () => {
    if (editingEmail.trim()) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editingEmail.trim())) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        return;
      }
      setEmail(editingEmail.trim());
      setShowEditEmailModal(false);
      // Save to AsyncStorage if needed
      try {
        const userObjString = await AsyncStorage.getItem('userObj');
        if (userObjString) {
          const userObj = JSON.parse(userObjString);
          userObj.email = editingEmail.trim();
          await AsyncStorage.setItem('userObj', JSON.stringify(userObj));
        }
      } catch (error) {
        console.error('Error saving email:', error);
      }
      showSuccessToast(t.emailUpdatedSuccessfully);
    }
  };

  const handleCloseEditFullnameModal = () => {
    setShowEditFullnameModal(false);
    setEditingFullname('');
  };

  const handleCloseEditEmailModal = () => {
    setShowEditEmailModal(false);
    setEditingEmail('');
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
            value: t.profile,
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
        }>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image 
                  source={{ uri: avatarUri }} 
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{getInitials(fullname)}</Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={handleEditAvatar}>
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
          {/* Personal Information Section */}
          <CartBox
            width="100%"
            backgroundColor={colors.background}
            borderRadius={12}
            borderWidth={0}
            borderColor={colors.border}
            marginBottom={12}
            height={159}
            alignItems="flex-start"
            justifyContent="flex-start">
            <Text style={styles.sectionHeadingInBox}>{t.personalInformation}</Text>
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={handleEditFullname}
              activeOpacity={0.7}>
              <Image 
                source={require('../../assets/icons/fullname.png')} 
                style={styles.infoIconImage}
                resizeMode="contain"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t.fullname}</Text>
                <Text style={styles.infoValue}>{fullname}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.infoRow, styles.emailRow]}
              onPress={handleEditEmail}
              activeOpacity={0.7}>
              <Image 
                source={require('../../assets/icons/email.png')} 
                style={styles.infoIconImage}
                resizeMode="contain"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t.email}</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>
            </TouchableOpacity>
          </CartBox>

          {/* Preferences Section */}
          <CartBox
            width="100%"
            backgroundColor={colors.background}
            borderRadius={12}
            borderWidth={0}
            borderColor={colors.border}
            marginBottom={12}
            height={82}
            alignItems="flex-start"
            justifyContent="flex-start">
            <Text style={styles.sectionHeadingInBox}>{t.preferences}</Text>
            <TouchableOpacity 
              style={styles.menuRowInBox}
              onPress={() => handleMenuPress('Language')}>
              <Image 
                source={require('../../assets/icons/lang.png')} 
                style={styles.menuIconImage}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>{t.language}</Text>
            </TouchableOpacity>
          </CartBox>

          {/* Support & Legal Section */}
          <CartBox
            width="100%"
            backgroundColor={colors.background}
            borderRadius={12}
            borderWidth={0}
            borderColor={colors.border}
            marginBottom={12}
            height={205}
            alignItems="flex-start"
            justifyContent="flex-start">
            <Text style={styles.sectionHeadingInBox}>{t.supportAndLegal}</Text>
            <TouchableOpacity 
              style={styles.menuRowInBox}
              onPress={() => handleMenuPress('Help center')}>
              <Image 
                source={require('../../assets/icons/hc.png')} 
                style={styles.menuIconImage}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>{t.helpCenter}</Text>
            </TouchableOpacity>
            
           
            
            <TouchableOpacity 
              style={styles.menuRowInBox}
              onPress={() => handleMenuPress('About us')}>
              <Image 
                source={require('../../assets/icons/au.png')} 
                style={styles.menuIconImage}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>{t.aboutUs}</Text>
            </TouchableOpacity>
            
          
            
            <TouchableOpacity 
              style={styles.menuRowInBox}
              onPress={() => handleMenuPress('Privacy policy')}>
              <Image 
                source={require('../../assets/icons/pp.png')} 
                style={styles.menuIconImage}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>{t.privacyPolicy}</Text>
            </TouchableOpacity>
            
          
            
            <TouchableOpacity 
              style={styles.menuRowInBox}
              onPress={() => handleMenuPress('Terms of Service')}>
              <Image 
                source={require('../../assets/icons/ts.png')} 
                style={styles.menuIconImage}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>{t.termsOfService}</Text>
            </TouchableOpacity>
          </CartBox>

          {/* Logout */}
          <CartBox
            width="100%"
            backgroundColor={colors.background}
            borderRadius={12}
            borderWidth={0}
            borderColor={colors.border}
            height={43}
            marginBottom={12}
            onPress={handleLogout}>
            <View style={styles.menuRowInBox}>
              <Image 
                source={require('../../assets/icons/logout.png')} 
                style={[styles.menuIconImage, styles.logoutIconImage]}
                resizeMode="contain"
              />
              <Text style={[styles.menuText, styles.logoutText]}>{t.logout}</Text>
            </View>
          </CartBox>
        </View>
      </ScrollView>
      <Footer_A />

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
            <Text style={styles.modalTitle}>{t.language}</Text>
            
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
              text={t.select}
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
        title={t.logoutTitle}
        titleStyle={styles.popupTitle}
        popupStyle={styles.popupBox}
        dismissOnOverlayPress={false}>
        <Text style={styles.popupMessage}>
        {t.logoutMessage}
        </Text>
        
        <View style={styles.popupButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelLogout}
            activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>{t.no}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmLogoutButton}
            onPress={handleConfirmLogout}
            activeOpacity={0.7}>
            <Text style={styles.confirmLogoutButtonText}>{t.yes}</Text>
          </TouchableOpacity>
        </View>
      </Popup>

      {/* Edit Fullname Modal */}
      <Modal
        visible={showEditFullnameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseEditFullnameModal}>
        <Pressable 
          style={styles.modalOverlay}
          onPress={handleCloseEditFullnameModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />
            
            {/* Title */}
            <Text style={styles.modalTitle}>{t.editFullname}</Text>
            
            {/* Input Field */}
            <InputBox
              label={t.fullname}
              placeholder={t.enterYourFullname}
              value={editingFullname}
              setValue={setEditingFullname}
              containerStyle={styles.editInputContainer}
            />
            
            {/* Save Button */}
            <Button1
              text={t.save}
              width="100%"
              onPress={handleSaveFullname}
              backgroundColor={colors.primary}
              height={39}
              containerStyle={styles.saveButton}
              textStyle={styles.saveButtonText}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Email Modal */}
      <Modal
        visible={showEditEmailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseEditEmailModal}>
        <Pressable 
          style={styles.modalOverlay}
          onPress={handleCloseEditEmailModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />
            
            {/* Title */}
            <Text style={styles.modalTitle}>{t.editEmail}</Text>
            
            {/* Input Field */}
            <InputBox
              label={t.email}
              placeholder={t.enterYourEmail}
              value={editingEmail}
              setValue={setEditingEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={styles.editInputContainer}
            />
            
            {/* Save Button */}
            <Button1
              text={t.save}
              width="100%"
              onPress={handleSaveEmail}
              backgroundColor={colors.primary}
              height={39}
              containerStyle={styles.saveButton}
              textStyle={styles.saveButtonText}
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
  },
  safeAreaTop: {
    backgroundColor: colors.secondary,
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
  sectionHeading: {
    fontSize: 12,
    fontFamily: fonts.family.regular,
    fontWeight: "400",
    color: colors.subtext2,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionHeadingInBox: {
    fontSize: 12,
    fontFamily: fonts.family.regular,
    fontWeight: "400",
    color: colors.subtext2,
    marginBottom: 8,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  emailRow: {
    paddingTop: 8,
    paddingBottom: 12,
  },
 
  infoIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  infoIconImage: {
    width: 16,
    height: 16,
 
    marginRight: 12,
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
  menuRowInBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuRowSeparator: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
  },
  menuIcon: {
    fontSize: 20,
  
    color: colors.text,
  },
  menuIconImage: {
    width: 17,
    height: 17,
    marginRight: 12,
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
    fontFamily: fonts.family.bold,
    fontWeight: "400",
    color:"#FF3B30",
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
  editInputContainer: {
    marginBottom: 24,
    minHeight: 52,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  saveButton: {
    borderRadius: 12,
  },
  saveButtonText: {
    color: colors.secondary,
    fontSize: fonts.size.m,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
  },
});
