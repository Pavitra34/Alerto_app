import colors from '@/styles/Colors';
import fonts from '@/styles/Fonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  BackHandler,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { validateLogin } from '../api/auth';
import { getTranslations } from '../assets/Translation';
import { Button1 } from '../components/common/Button';
import InputBox from '../components/common/InputBox';
import Toast, { showErrorToast, toastConfig } from '../components/common/Toast';

export default function LoginScreen() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [langId, setLangId] = useState<string>('en');
  const [t, setT] = useState(getTranslations('en'));

  const emailRef = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);

  // Disable Android hardware back button
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        return true; // Prevent going back
      });
      return () => backHandler.remove();
    }
  }, []);

  // Load language and clear fields when screen is focused
  React.useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLangId = await AsyncStorage.getItem('langId') || 'en';
        setLangId(storedLangId);
        setT(getTranslations(storedLangId));
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    
    loadLanguage();
    setEmailOrUsername('');
    setPassword('');
    setEmailError('');
    setPasswordError('');
  }, []);

  // Update translations when langId changes
  React.useEffect(() => {
    setT(getTranslations(langId));
  }, [langId]);

  // Email/Username validation
  const validateEmailOrUsername = (text: string): string => {
    if (!text || text.trim().length === 0) {
      return t.emailRequired || 'Email/Username is required';
    }
    
    // Check if it's a username (not an email - doesn't contain @)
    // If it's a username, it must start with uppercase
    const trimmedText = text.trim();
    if (!trimmedText.includes('@')) {
      // It's a username, check if it starts with uppercase
      const firstChar = trimmedText.charAt(0);
      if (firstChar && !/[A-Z]/.test(firstChar)) {
        return t.usernameMustStartUppercase || 'Username must start with an uppercase letter';
      }
    }
    
    return '';
  };

  // Password validation
  const validatePassword = (pwd: string): string => {
    if (!pwd || pwd.trim().length === 0) {
      return t.passwordRequired;
    }
    
    // Check for uppercase letter
    const hasUppercase = /[A-Z]/.test(pwd);
    if (!hasUppercase) {
      return t.passwordMustContainUppercase;
    }
    
    // Check for lowercase letter
    const hasLowercase = /[a-z]/.test(pwd);
    if (!hasLowercase) {
      return t.passwordMustContainLowercase;
    }
    
    // Check for symbol (special character)
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    if (!hasSymbol) {
      return t.passwordMustContainSymbol;
    }
    
    return '';
  };

  // Handle email/username change
  const handleEmailChange = (text: string) => {
    setEmailOrUsername(text);
    console.log('Email/Username:', text);
    
    // Clear error when user starts typing
    if (emailError) {
      setEmailError('');
    }
  };

  // Handle password change
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    console.log('Password:', text);
    
    // Clear error when user starts typing
    if (passwordError) {
      setPasswordError('');
    }
  };

  // Handle login
  const handleSignIn = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    // Validate inputs
    const emailErr = validateEmailOrUsername(emailOrUsername);
    const pwdErr = validatePassword(password);

    if (emailErr || pwdErr) {
      setEmailError(emailErr);
      setPasswordError(pwdErr);
      Keyboard.dismiss();
      return;
    }

    try {
      // Validate login using backend API
      const loginResult = await validateLogin(emailOrUsername.trim(), password);

      if (loginResult) {
        const { user, token, fullUser } = loginResult;

        // Log token in terminal for testing
        console.log('\n🔑 ========== LOGIN SUCCESS ==========');
        console.log('📧 Email/Username:', emailOrUsername);
        console.log('👤 User ID:', user.id);
        console.log('👤 Username:', fullUser.username);
        console.log('👤 Fullname:', fullUser.fullname);
        console.log('👤 Role:', fullUser.role);
        console.log('🔑 Token:', token);
        console.log('📋 Token (for Authorization header):');
        console.log('   Bearer ' + token);
        console.log('=====================================\n');

        // Save token and userId to AsyncStorage
        try {
          await AsyncStorage.setItem('authToken', token);
          await AsyncStorage.setItem('userId', user.id);
          
          // Save full user object
          await AsyncStorage.setItem('userObj', JSON.stringify(fullUser));
          
          console.log('✅ Token and user data saved to AsyncStorage');
        } catch (storageError) {
          console.error('Error saving to storage:', storageError);
          showErrorToast(t.failedToSaveUserData);
          return;
        }

        // Navigate based on user role (toast will show in EmployeeScreen)
        const role = fullUser.role;
        
        // Get langId and userId for navigation params
        const langId = await AsyncStorage.getItem('langId') || 'en';
        const userId = user.id;
        
        // Navigate based on user role
        if (role === 'admin') {
          router.replace({
            pathname: '/admin',
            params: { 
              showLoginSuccess: 'true',
              langId: langId,
              userId: userId
            }
          });
        } else if (role === 'employee') {
          router.replace({
            pathname: '/employee',
            params: { 
              showLoginSuccess: 'true',
              langId: langId,
              userId: userId
            }
          });
        } else {
          // Default fallback
          router.replace('/(tabs)');
        }
      } else {
        // Invalid credentials
        Keyboard.dismiss();
        setEmailOrUsername('');
        setPassword('');
        showErrorToast(t.invalidCredential);
        // Don't focus email field - keep keyboard dismissed
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Hide keyboard when showing error
      Keyboard.dismiss();
      
      // Check if it's a network/connection error
      if (error?.message && (
        error.message.includes('Network request failed') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Cannot connect to backend server')
      )) {
        // Show network error message (frontend message, not backend)
        showErrorToast('Cannot connect to server. Please check your connection.');
        return;
      }
      
      // Check if it's an invalid credentials error (401 or "Invalid credentials" message)
      // Always show frontend message, never show backend error message
      if (error?.message && (
        error.message.includes('Invalid credentials') ||
        error.message.includes('Invalid credential') ||
        error.message.toLowerCase().includes('invalid') && error.message.toLowerCase().includes('credential') ||
        error.message.includes('401') ||
        error.message.includes('Server error: 401')
      )) {
        // Show user-friendly invalid credentials message (frontend message only)
        showErrorToast(t.invalidCredential || 'Invalid email/username or password. Please try again.');
        return;
      }
      
      // For any other errors, show generic login failed message (frontend message, not backend)
      showErrorToast(t.loginFailed || 'Login failed. Please try again.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <View style={styles.body}>
          {/* Logo */}
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Greeting */}
          <View style={styles.greeting_group}>
            <Text style={styles.greetingTitle}>{t.welcomeBack}</Text>
            <Text style={styles.greetingSubtitle}>{t.pleaseSignIn}</Text>
          </View>

          {/* Input Fields */}
          <View style={styles.inputsContainer}>
            <InputBox
              label={t.emailOrUsername}
              placeholder={t.enterEmailOrUsername}
              value={emailOrUsername}
              setValue={handleEmailChange}
              errorMessage={emailError}
              ref={emailRef}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <InputBox
              label={t.password}
              placeholder={t.passwordPlaceholder}
              //secureTextEntry={!showPassword}
              value={password}
              setValue={handlePasswordChange}
              errorMessage={passwordError}
              ref={passwordRef}
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              autoCapitalize="none"
              autoCorrect={false}
              rightIcon={
                showPassword
                  ? require('../assets/icons/eye_open.png')
                  : require('../assets/icons/eye_close.png')
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />
          </View>

          {/* Login Button */}
          <View style={styles.signInBtnWrap}>
            <Button1 text={t.login} width={'90%'} onPress={handleSignIn} />
          </View>
        </View>
        <Toast config={toastConfig} />
      </KeyboardAvoidingView>
     
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  body: {
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 24,
  },
  logo: {
    width: 143,
    height: 83,
    alignSelf: 'center',
    resizeMode: 'contain',
    marginTop: 80,
  },
  greeting_group: {
    marginTop: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  greetingTitle: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fonts.family.medium,
    fontWeight: 500,
  },
  greetingSubtitle: {
    color: "#6B7280",
    fontSize:14,
    fontFamily: fonts.family.regular,
    fontWeight: 400,
    marginTop: 6,
  },
  inputsContainer: {
    paddingHorizontal: 20,
  },
  signInBtnWrap: {
    marginTop: 10,
    alignItems: 'center',
  },
});

