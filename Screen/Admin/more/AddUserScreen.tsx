import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
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
  const [phoneNumber, setPhoneNumber] = useState<string>('1234 567 891');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+49'); // Germany default
  const [showCountryPicker, setShowCountryPicker] = useState<boolean>(false);

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
    console.log('Save user:', { fullname, email, phoneNumber, username, password });
    // Add save logic here
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const countryCodes = [
    { code: '+49', flag: '🇩🇪', name: 'Germany' },
    { code: '+1', flag: '🇺🇸', name: 'USA' },
    { code: '+44', flag: '🇬🇧', name: 'UK' },
    { code: '+91', flag: '🇮🇳', name: 'India' },
  ];

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

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}>
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
            label={t.fullname || 'Fullname'}
            placeholder={t.enterTheFullname || 'Enter the Fullname'}
            value={fullname}
            setValue={setFullname}
            containerStyle={styles.inputContainer}
          />

          {/* Email */}
          <InputBox
            label={t.email || 'Email'}
            placeholder={t.enterTheEmail || 'Enter the email'}
            value={email}
            setValue={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={styles.inputContainer}
          />

          {/* Phone Number */}
          <View style={styles.phoneContainer}>
            <Text style={styles.phoneLabel}>{t.phoneNumber || 'Phone number'}</Text>
            <View style={styles.phoneInputRow}>
              <TouchableOpacity
                style={styles.countryCodeButton}
                onPress={() => setShowCountryPicker(!showCountryPicker)}
                activeOpacity={0.7}>
                <Image
                  source={require('../../../assets/icons/german.png')}
                  style={styles.flagIcon}
                  resizeMode="contain"
                />
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
              <View style={styles.phoneInputWrapper}>
                <InputBox
                  placeholder="1234 567 891"
                  value={phoneNumber}
                  setValue={setPhoneNumber}
                  keyboardType="phone-pad"
                  containerStyle={styles.phoneInputContainer}
                />
              </View>
            </View>
          </View>

          {/* Username */}
          <InputBox
            label={t.username || 'Username'}
            placeholder={t.enterTheUsername || 'Enter the username'}
            value={username}

            setValue={setUsername}
            autoCapitalize="none"
            containerStyle={styles.inputContainer}
          />

          {/* Password */}
          <InputBox
            label={t.password || 'Password'}
            placeholder="********"
            value={password}
            setValue={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={showPassword 
              ? require('../../../assets/icons/eye_open.png')
              : require('../../../assets/icons/eye_close.png')
            }
            onRightIconPress={togglePasswordVisibility}
            containerStyle={styles.inputContainer}
          />
        </View>

        {/* Save Button */}
        <Button1
          text={t.save || 'Save'}
          width="100%"
          onPress={handleSave}
          backgroundColor={colors.primary}
          height={39}
          containerStyle={styles.saveButton}
          textStyle={styles.saveButtonText}
        />
      </ScrollView>
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
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.family.bold,
    fontWeight: fonts.weight.bold,
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext2,
    lineHeight: 20,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
    minHeight: 52,
    height: 52,
  },
  phoneContainer: {
    marginBottom: 20,
  },
  phoneLabel: {
    color: colors.primary,
    fontSize: fonts.size.xs,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    marginBottom: 4,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.secondary,
    gap: 8,
    minWidth: 80,
  },
  flagIcon: {
    width: 20,
    height: 20,
  },
  dropdownIcon: {
    fontSize: 10,
    color: colors.text,
  },
  phoneInputWrapper: {
    flex: 1,
  },
  phoneInputContainer: {
    marginBottom: 0,
    minHeight: 52,
    height: 52,
  },
  saveButton: {
    marginTop: 8,
  },
  saveButtonText: {
    color: colors.secondary,
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
  },
});

