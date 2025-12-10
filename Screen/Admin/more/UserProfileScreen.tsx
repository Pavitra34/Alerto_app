import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dummyUsers, findUserById, User } from '../../../api/users';
import { getTranslations } from '../../../assets/Translation';
import { Button1 } from '../../../components/common/Button';
import CartBox from '../../../components/common/CartBox';
import Header from '../../../components/common/Header';
import InputBox from '../../../components/common/InputBox';
import Popup from '../../../components/common/Popup';
import Toast, { showSuccessToast, toastConfig } from '../../../components/common/Toast';
import colors from '../../../styles/Colors';
// @ts-ignore
import fonts from '../../../styles/Fonts';

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  // Fix: Properly handle both 'true' and 'false' string values
  const activeStatusParam = params.activeStatus as string;
  const activeStatus = activeStatusParam === 'true';
  const [user, setUser] = useState<User | undefined>(undefined);
  const [t, setT] = useState(getTranslations('en'));
  
  // Edit modal states
  const [showEditFullnameModal, setShowEditFullnameModal] = useState(false);
  const [showEditUsernameModal, setShowEditUsernameModal] = useState(false);
  const [showEditEmailModal, setShowEditEmailModal] = useState(false);
  const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);
  
  // Delete popup state
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  
  // Country picker state
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+49'); // Germany default
  const [phoneError, setPhoneError] = useState<string>('');
  
  // Edit values
  const [editingFullname, setEditingFullname] = useState('');
  const [editingUsername, setEditingUsername] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [editingPhone, setEditingPhone] = useState('');
  
  // Country codes (same as AddUserScreen)
  const countryCodes = [
    { code: '+49', flag: require('../../../assets/icons/german.png'), name: 'Germany', maxLength: 11 },
    { code: '+44', flag: require('../../../assets/icons/english.png'), name: 'UK', maxLength: 10 },
  ];
  
  const selectedCountry = countryCodes.find(c => c.code === selectedCountryCode) || countryCodes[0];

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
    const interval = setInterval(() => {
      loadLanguage();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (userId) {
      const userData = findUserById(userId);
      setUser(userData);
    }
  }, [userId]);

  const getInitials = (name: string): string => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
    const handleBack = () => {
    router.back();
  };

  const handleMailPress = () => {
    if (user?.email) {
      Linking.openURL(`mailto:${user.email}`);
    }
  };

  const handleCallPress = () => {
    if (user?.phonenumber) {
      Linking.openURL(`tel:${user.phonenumber}`);
    }
  };

  const handleDeleteStaff = () => {
    setShowDeletePopup(true);
  };

  const handleCancelDelete = () => {
    setShowDeletePopup(false);
  };

  const handleConfirmDelete = () => {
    // Dummy delete action - in real app, this would be an API call
    if (user) {
      // Remove user from dummyUsers array
      const userIndex = dummyUsers.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        dummyUsers.splice(userIndex, 1);
      }
      console.log('User deleted:', userId);
    }
    
    // Close popup and navigate back
    setShowDeletePopup(false);
    router.back();
  };

  // Edit handlers
  const handleEditFullname = () => {
    if (user) {
      setEditingFullname(user.fullname);
      setShowEditFullnameModal(true);
    }
  };

  const handleEditUsername = () => {
    if (user) {
      setEditingUsername(user.username);
      setShowEditUsernameModal(true);
    }
  };

  const handleEditEmail = () => {
    if (user) {
      setEditingEmail(user.email);
      setShowEditEmailModal(true);
    }
  };

  const handleEditPhone = () => {
    if (user) {
      // Parse existing phone number - assume it's stored without country code
      // Default to +49 (Germany) if we can't determine
      const phoneStr = user.phonenumber.toString();
      // Try to detect country code from phone number length/format
      // For now, default to +49
      setSelectedCountryCode('+49');
      setEditingPhone(phoneStr);
      setPhoneError('');
      setShowEditPhoneModal(true);
    }
  };
  
  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    setShowCountryPicker(false);
    // Clear error when country changes
    setPhoneError('');
  };
  
  const handlePhoneNumberChange = (text: string) => {
    // Remove non-numeric characters
    const numericText = text.replace(/[^0-9]/g, '');
    
    // Get max length for selected country
    const selectedCountry = countryCodes.find(c => c.code === selectedCountryCode);
    const maxLength = selectedCountry?.maxLength || 11;
    
    // Clear error if user is typing
    if (phoneError) {
      setPhoneError('');
    }
    
    // Check if exceeds max length
    if (numericText.length > maxLength) {
      setPhoneError(`Maximum ${maxLength} numbers`);
      setEditingPhone(numericText.substring(0, maxLength));
    } else {
      setEditingPhone(numericText);
    }
  };
  
  const handleCloseCountryPicker = () => {
    setShowCountryPicker(false);
  };

  // Save handlers
  const handleSaveFullname = () => {
    if (editingFullname.trim() && user) {
      // Update user in dummyUsers array
      const userIndex = dummyUsers.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        dummyUsers[userIndex].fullname = editingFullname.trim();
        setUser({ ...user, fullname: editingFullname.trim() });
        showSuccessToast(t.fullnameUpdatedSuccessfully || 'Fullname updated successfully');
      }
      setShowEditFullnameModal(false);
    }
  };

  const handleSaveUsername = () => {
    if (editingUsername.trim() && user) {
      // Update user in dummyUsers array
      const userIndex = dummyUsers.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        dummyUsers[userIndex].username = editingUsername.trim();
        setUser({ ...user, username: editingUsername.trim() });
        showSuccessToast('Username updated successfully');
      }
      setShowEditUsernameModal(false);
    }
  };

  const handleSaveEmail = () => {
    if (editingEmail.trim() && user) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editingEmail.trim())) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        return;
      }
      // Update user in dummyUsers array
      const userIndex = dummyUsers.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        dummyUsers[userIndex].email = editingEmail.trim();
        setUser({ ...user, email: editingEmail.trim() });
        showSuccessToast(t.emailUpdatedSuccessfully || 'Email updated successfully');
      }
      setShowEditEmailModal(false);
    }
  };

  const handleSavePhone = () => {
    // Reset error
    setPhoneError('');
    
    // Validate phone number
    if (!editingPhone.trim()) {
      setPhoneError(t.phoneNumberRequired || 'Phone number is required');
      return;
    }
    
    const selectedCountry = countryCodes.find(c => c.code === selectedCountryCode);
    const maxLength = selectedCountry?.maxLength || 11;
    
    if (editingPhone.length > maxLength) {
      setPhoneError(`Maximum ${maxLength} numbers`);
      return;
    }
    
    if (user) {
      // Update user in dummyUsers array
      const userIndex = dummyUsers.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        // Store phone number as integer (without country code, as per existing structure)
        dummyUsers[userIndex].phonenumber = parseInt(editingPhone.trim(), 10);
        setUser({ ...user, phonenumber: parseInt(editingPhone.trim(), 10) });
        showSuccessToast('Phone number updated successfully');
      }
      setShowEditPhoneModal(false);
      setPhoneError('');
    }
  };

  // Close handlers
  const handleCloseEditFullnameModal = () => {
    setShowEditFullnameModal(false);
    setEditingFullname('');
  };

  const handleCloseEditUsernameModal = () => {
    setShowEditUsernameModal(false);
    setEditingUsername('');
  };

  const handleCloseEditEmailModal = () => {
    setShowEditEmailModal(false);
    setEditingEmail('');
  };

  const handleCloseEditPhoneModal = () => {
    setShowEditPhoneModal(false);
    setEditingPhone('');
    setPhoneError('');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t.unknown}</Text>
      </View>
    );
  }

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
            url: require('../../../assets/icons/arrow.png'),
            width: 23,
            height: 23,
            onPress: handleBack,
          }}
          center={{
            type: 'text',
            value: t.usersProfile,
          }}
        />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Profile Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user.fullname)}</Text>
          </View>
          {activeStatus && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{t.active}</Text>
            </View>
          )}
        </View>

        {/* Personal Information Section */}
        <CartBox
          width="100%"
          borderRadius={16}
          borderWidth={0}
          backgroundColor={colors.background}
          paddingTop={13}
          paddingBottom={0}
          paddingRight={20}
          paddingLeft={20}
          marginBottom={0}
          alignItems="flex-start">
          <Text style={styles.sectionTitle}>{t.personalInformation}</Text>

          {/* Staff Name */}
          <TouchableOpacity
            style={styles.infoRow}
            onPress={handleEditFullname}
            activeOpacity={0.7}>
            <View style={styles.infoLeft}>
              <Image
                source={require('../../../assets/icons/fullname.png')}
                style={styles.infoIcon}
                resizeMode="contain"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t.staffName}</Text>
                <Text style={styles.infoValue}>{user.fullname}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Username */}
          <TouchableOpacity
            style={styles.infoRow}
            onPress={handleEditUsername}
            activeOpacity={0.7}>
            <View style={styles.infoLeft}>
              <Image
                source={require('../../../assets/icons/fullname.png')}
                style={styles.infoIcon}
                resizeMode="contain"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t.username}</Text>
                <Text style={styles.infoValue}>{user.username}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Email */}
          <View style={styles.infoRow}>
            <TouchableOpacity
              style={styles.infoLeft}
              onPress={handleEditEmail}
              activeOpacity={0.7}>
              <Image
                source={require('../../../assets/icons/email.png')}
                style={styles.infoIcon}
                resizeMode="contain"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t.email}</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMailPress}
              activeOpacity={0.7}>
              <Text style={styles.actionButtonText}>{t.mail}</Text>
            </TouchableOpacity>
          </View>

          {/* Phone Number */}
          <View style={styles.infoRow}>
            <TouchableOpacity
              style={styles.infoLeft}
              onPress={handleEditPhone}
              activeOpacity={0.7}>
              <Image
                source={require('../../../assets/icons/phone.png')}
                style={styles.infoIcon}
                resizeMode="contain"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t.phoneNumber}</Text>
                <Text style={styles.infoValue}>{user.phonenumber.toString()}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCallPress}
              activeOpacity={0.7}>
              <Text style={styles.actionButtonText}>{t.call}</Text>
            </TouchableOpacity>
          </View>
        </CartBox>

        {/* Delete Staff Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteStaff}
          activeOpacity={0.7}>
          <Image
                source={require('../../../assets/icons/delete.png')}
                style={styles.infoIcon}
                resizeMode="contain"
              />
          <Text style={styles.deleteButtonText}>{t.deleteStaff}</Text>
        </TouchableOpacity>
      </ScrollView>

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
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>{t.editFullname}</Text>
            <InputBox
              label={t.fullname}
              placeholder={t.enterYourFullname}
              value={editingFullname}
              setValue={setEditingFullname}
              containerStyle={styles.editInputContainer}
            />
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

      {/* Edit Username Modal */}
      <Modal
        visible={showEditUsernameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseEditUsernameModal}>
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCloseEditUsernameModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>{t.editUsername}</Text>
            <InputBox
              label={t.username}
              placeholder={t.enterYourUsername}
              value={editingUsername}
              setValue={setEditingUsername}
              containerStyle={styles.editInputContainer}
            />
            <Button1
              text={t.save}
              width="100%"
              onPress={handleSaveUsername}
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
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>{t.editEmail}</Text>
            <InputBox
              label={t.email}
              placeholder={t.enterYourEmail}
              value={editingEmail}
              setValue={setEditingEmail}
              keyboardType="email-address"
              containerStyle={styles.editInputContainer}
            />
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

      {/* Edit Phone Modal */}
      <Modal
        visible={showEditPhoneModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseEditPhoneModal}>
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCloseEditPhoneModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>{t.editPhoneNumber}</Text>
            
            {/* Phone Number Input with Country Code */}
            <View style={styles.phoneInputWrapper}>
              <View style={[
                styles.phoneInputContainer,
                phoneError && styles.phoneInputContainerError
              ]}>
                <Text style={styles.phoneLabel}>{t.phoneNumber}</Text>
                <View style={styles.phoneInputBox}>
                  <TouchableOpacity
                    style={styles.countryCodeSection}
                    onPress={() => setShowCountryPicker(true)}
                    activeOpacity={0.7}>
                    <Image
                      source={selectedCountry.flag}
                      style={styles.flagIconStyle}
                      resizeMode="contain"
                    />
                    <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
                    <Image
                      source={require('../../../assets/icons/drop.png')}
                      style={styles.dropdownArrowStyle}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.phoneNumberInput}
                    placeholder="123456789"
                    placeholderTextColor={colors.subtext3}
                    value={editingPhone}
                    onChangeText={handlePhoneNumberChange}
                    keyboardType="phone-pad"
                    maxLength={selectedCountry.maxLength || 11}
                  />
                </View>
              </View>
              {phoneError ? (
                <Text style={styles.phoneError}>{phoneError}</Text>
              ) : null}
            </View>
            
            {/* Save and Cancel Buttons */}
            <View style={styles.phoneModalButtons}>
              <TouchableOpacity
                style={styles.cancelPhoneButton}
                onPress={handleCloseEditPhoneModal}
                activeOpacity={0.7}>
                <Text style={styles.cancelPhoneButtonText}>{t.no || 'Cancel'}</Text>
              </TouchableOpacity>
              <Button1
                text={t.save}
                width="48%"
                onPress={handleSavePhone}
                backgroundColor={colors.primary}
                height={39}
                containerStyle={styles.savePhoneButton}
                textStyle={styles.saveButtonText}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseCountryPicker}>
        <Pressable 
          style={styles.modalOverlay}
          onPress={handleCloseCountryPicker}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>Select Country</Text>
            
            <View style={styles.countryOptions}>
              {countryCodes.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryOption,
                    selectedCountryCode === country.code && styles.countryOptionSelected,
                  ]}
                  onPress={() => handleCountrySelect(country.code)}
                  activeOpacity={0.7}>
                  <Image
                    source={country.flag}
                    style={styles.countryFlagIcon}
                    resizeMode="contain"
                  />
                  <Text style={[
                    styles.countryCodeText,
                    selectedCountryCode === country.code && styles.countryCodeTextSelected,
                  ]}>
                    {country.code}
                  </Text>
                  <Text style={[
                    styles.countryName,
                    selectedCountryCode === country.code && styles.countryNameSelected,
                  ]}>
                    {country.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Staff Confirmation Popup */}
      <Popup
        visible={showDeletePopup}
        onClose={handleCancelDelete}
        title={t.deleteStaffRecord}
        titleStyle={styles.popupTitle}
        popupStyle={styles.popupBox}
        dismissOnOverlayPress={false}>
        <Text style={styles.popupMessage}>
          {t.deleteStaffMessage}
        </Text>
        
        <View style={styles.popupButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelDelete}
            activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>{t.no}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmDeleteButton}
            onPress={handleConfirmDelete}
            activeOpacity={0.7}>
            <Text style={styles.confirmDeleteButtonText}>{t.yes}</Text>
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
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.button_text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fonts.size.xxxl,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.secondary,
  },
  activeBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.status_active,
    paddingHorizontal: 5,
    paddingVertical: 5.5,
    borderRadius: 10,
    minWidth: 50,
    alignItems: 'center',
  },
  activeBadgeText: {
    fontSize: fonts.size.xs,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  sectionTitle: {
    fontSize: fonts.size.s,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext,
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
    marginBottom: 12,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: "flex-start",
    flex: 1,
  },
  infoIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  atIconContainer: {
    width: 20,
    height: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth:1
  },
  atIconText: {
    fontSize: 16,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.primary,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.text,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: fonts.size.s,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.secondary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    marginTop: 12,
  },
  deleteIconText: {
    fontSize: 20,
    marginRight: 12,
  },
  deleteButtonText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.logout_text,
  },
  errorText: {
    fontSize: fonts.size.l,
    fontFamily: fonts.family.regular,
    color: colors.text,
    textAlign: 'center',
    marginTop: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    maxHeight: '70%',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 6,
    backgroundColor: colors.modal_line,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: fonts.size.l,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.medium,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  editInputContainer: {
    marginBottom: 20,
  },
  saveButton: {
    marginTop: 10,
  },
  saveButtonText: {
    color: colors.secondary,
    fontSize: fonts.size.l,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.medium,
  },
  popupBox: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderColor: colors.popupBorderColor,
  },
  popupTitle: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  popupMessage: {
    fontSize: fonts.size.s,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 18,
  },
  popupButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.button_background,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 39,
  },
  cancelButtonText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.medium,
    color: colors.button_text,
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 39,
  },
  confirmDeleteButtonText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  phoneInputWrapper: {
    marginBottom: 20,
  },
  phoneLabel: {
    color: colors.primary,
    fontSize: fonts.size.xs,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    marginBottom: 4,
  },
  phoneInputContainer: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: 52,
  },
  phoneInputContainerError: {
    borderColor: colors.error_text || '#FF3B30',
  },
  phoneInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryCodeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagIconStyle: {
    width: 20,
    height: 20,
  },
  dropdownArrowStyle: {
    width: 12,
    height: 12,
  },
  phoneNumberInput: {
    flex: 1,
    fontSize: fonts.size.m,
    color: colors.text,
    padding: 0,
    margin: 0,
    marginTop: 2,
    fontFamily: fonts.family.regular,
  },
  phoneError: {
    fontSize: 12,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.error_text || '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
  phoneModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  cancelPhoneButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelPhoneButtonText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: '#6B7280',
  },
  savePhoneButton: {
    marginTop: 0,
  },
  countryOptions: {
    marginBottom: 24,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 12,
  },
  countryOptionSelected: {
    borderColor: colors.primary,
  },
  countryFlagIcon: {
    width: 24,
    height: 24,
  },
  countryCodeText: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.text,
  },
  countryCodeTextSelected: {
    color: colors.text,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
  },
  countryName: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext2,
  },
  countryNameSelected: {
    color: colors.text,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
  },
});

