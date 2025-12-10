import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../../components/common/Header';
import InputBox from '../../../components/common/InputBox';
import { Button1 } from '../../../components/common/Button';
import { getTranslations } from '../../../assets/Translation';
import colors from '../../../styles/Colors';
// @ts-ignore
import fonts from '../../../styles/Fonts';

export default function AddUserScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [t, setT] = useState(getTranslations('en'));
  const [fullname, setFullname] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+49'); // Germany default
  const [showCountryPicker, setShowCountryPicker] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [fullnameError, setFullnameError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // Refs for input navigation
  const fullnameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLangId = await AsyncStorage.getItem('langId') || 'en';
        setT(getTranslations(storedLangId));
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleSave = () => {
    // Reset all errors
    setFullnameError('');
    setEmailError('');
    setPhoneError('');
    setUsernameError('');
    setPasswordError('');

    let isValid = true;

    // Validate Fullname
    if (!fullname.trim()) {
      setFullnameError('Fullname is required');
      isValid = false;
    }

    // Validate Email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Invalid email format');
        isValid = false;
      }
    }

    // Validate Phone Number
    if (!phoneNumber.trim()) {
      setPhoneError(t.phoneNumberRequired || 'Phone number is required');
      isValid = false;
    } else {
      const selectedCountry = countryCodes.find(c => c.code === selectedCountryCode);
      const maxLength = selectedCountry?.maxLength || 11;
      if (phoneNumber.length > maxLength) {
        setPhoneError(`Maximum ${maxLength} numbers`);
        isValid = false;
      }
    }

    // Validate Username
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    }

    // Validate Password
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    }

    // If all valid, save the data
    if (isValid) {
      const userData = {
        fullname: fullname.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        countryCode: selectedCountryCode,
        username: username.trim(),
        password: password.trim(),
      };
      console.log('Save user:', userData);
      // Add save logic here
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const countryCodes = [
    { code: '+49', flag: require('../../../assets/icons/german.png'), name: 'Germany', maxLength: 11 },
    { code: '+44', flag: require('../../../assets/icons/english.png'), name: 'UK', maxLength: 10 },
  ];

  const selectedCountry = countryCodes.find(c => c.code === selectedCountryCode) || countryCodes[0];

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
      setPhoneNumber(numericText.substring(0, maxLength));
    } else {
      setPhoneNumber(numericText);
    }
  };

  const handleCloseCountryPicker = () => {
    setShowCountryPicker(false);
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
          left={{
            type: 'image',
            url: require('../../../assets/icons/arrow.png'),
            width: 23,
            height: 23,
            onPress: handleBack,
          }}
          center={{
            type: 'text',
            value: t.addUsers || 'Add users',
          }}
        />
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none">
        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.addNewUser || 'Add new user'}</Text>
          <Text style={styles.sectionSubtitle}>
            {t.createAccountCredentials || 'Create account credentials for a new staff.'}
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Fullname */}
          <InputBox
            ref={fullnameRef}
            label={t.fullname || 'Fullname'}
            placeholder={t.enterTheFullname || 'Enter the Fullname'}
            value={fullname}
            setValue={(text) => {
              setFullname(text);
              if (fullnameError) setFullnameError('');
            }}
            errorMessage={fullnameError}
            containerStyle={styles.inputContainer}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          {/* Email */}
          <InputBox
            ref={emailRef}
            label={t.email || 'Email'}
            placeholder={t.enterTheEmail || 'Enter the email'}
            value={email}
            setValue={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
            }}
            errorMessage={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            containerStyle={styles.inputContainer}
            onSubmitEditing={() => phoneRef.current?.focus()}
          />

          {/* Phone Number */}
          <View style={styles.phoneInputWrapper}>
            <View style={[
              styles.phoneInputContainer,
              phoneError && styles.phoneInputContainerError
            ]}>
              <Text style={styles.phoneLabel}>{t.phoneNumber || 'Phone number'}</Text>
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
                  ref={phoneRef}
                  style={styles.phoneNumberInput}
                  placeholder="123456789"
                  placeholderTextColor={colors.subtext3}
                  value={phoneNumber}
                  onChangeText={handlePhoneNumberChange}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  maxLength={selectedCountry.maxLength || 11}
                  onSubmitEditing={() => usernameRef.current?.focus()}
                />
              </View>
            </View>
            {phoneError ? (
              <Text style={styles.phoneError}>{phoneError}</Text>
            ) : null}
          </View>

          {/* Username */}
          <InputBox
            ref={usernameRef}
            label={t.username || 'Username'}
            placeholder={t.enterTheUsername || 'Enter the username'}
            value={username}
            setValue={(text) => {
              setUsername(text);
              if (usernameError) setUsernameError('');
            }}
            errorMessage={usernameError}
            autoCapitalize="none"
            returnKeyType="next"
            containerStyle={styles.inputContainer}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          {/* Password */}
          <InputBox
            ref={passwordRef}
            label={t.password || 'Password'}
            placeholder="********"
            value={password}
            setValue={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
            }}
            errorMessage={passwordError}
            secureTextEntry={!showPassword}
            keyboardType="default"
            rightIcon={showPassword 
              ? require('../../../assets/icons/eye_open.png')
              : require('../../../assets/icons/eye_close.png')
            }
            onRightIconPress={togglePasswordVisibility}
            containerStyle={styles.inputContainer}
            returnKeyType="done"
            onSubmitEditing={() => passwordRef.current?.blur()}
            onFocus={() => {
              // Scroll to password input when focused to keep it above keyboard
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button - Fixed at Bottom */}
      <View style={[styles.saveButtonContainer, { paddingBottom: insets.bottom + 20 }]}>
        <Button1
          text={t.save || 'Save'}
          width="100%"
          onPress={handleSave}
          backgroundColor={colors.primary}
          height={39}
          containerStyle={styles.saveButton}
          textStyle={styles.saveButtonText}
        />
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  safeAreaTop: {
    backgroundColor: colors.secondary,
  },
  content: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.family.bold,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: fonts.family.regular,
    fontWeight: '400',
    color: "#9CA3AF",
    lineHeight: 20,
  },
  formContainer: {
    marginBottom: 16,
  },
  inputContainer: {

    height: 52,
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
  countryCodeText: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.text,
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
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.secondary,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  saveButton: {
    marginTop: 0,
  },
  saveButtonText: {
    color: colors.secondary,
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
  },
});

