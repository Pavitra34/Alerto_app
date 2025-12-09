import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { validateLogin } from '../api/auth';
import { findUserById } from '../api/users';
import { Button1 } from '../components/common/Button';
import InputBox from '../components/common/InputBox';
import Toast, { showErrorToast, toastConfig } from '../components/common/Toast';
import colors from '@/styles/Colors';
import fonts from '@/styles/Fonts';

export default function LoginScreen() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

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

  // Clear fields when screen is focused
  React.useEffect(() => {
    setEmailOrUsername('');
    setPassword('');
    setEmailError('');
    setPasswordError('');
  }, []);

  // Email/Username validation
  const validateEmailOrUsername = (text: string): string => {
    if (!text || text.trim().length === 0) {
      return 'Email or Username is required';
    }
    return '';
  };

  // Password validation
  const validatePassword = (pwd: string): string => {
    if (!pwd || pwd.trim().length === 0) {
      return 'Password is required';
    }
    return '';
  };

  // Handle email/username change
  const handleEmailChange = (text: string) => {
    setEmailOrUsername(text);
    console.log('Email/Username:', text);
    if (emailError) setEmailError('');
  };

  // Handle password change
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    console.log('Password:', text);
    if (passwordError) setPasswordError('');
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
      // Validate login using auth.ts
      const authUser = validateLogin(emailOrUsername.trim(), password);

      if (authUser) {
        // Get user details using users.ts
        const userDetails = findUserById(authUser.id);

        if (!userDetails) {
          showErrorToast('User details not found');
          return;
        }

        // Generate token
        const token = `dummy-token-${authUser.id}`;

        // Save token and userId to AsyncStorage
        try {
          await AsyncStorage.setItem('authToken', token);
          await AsyncStorage.setItem('userId', authUser.id);
          
          // Save full user object
          const fullUser = { ...authUser, ...userDetails };
          await AsyncStorage.setItem('userObj', JSON.stringify(fullUser));
        } catch (storageError) {
          console.error('Error saving to storage:', storageError);
          showErrorToast('Failed to save user data');
          return;
        }

        // Navigate based on user role (toast will show in EmployeeScreen)
        const role = userDetails.role;
        
        // Get langId and userId for navigation params
        const langId = await AsyncStorage.getItem('langId') || 'en';
        const userId = authUser.id;
        
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
        showErrorToast('Invalid credential');
        // Don't focus email field - keep keyboard dismissed
      }
    } catch (error) {
      console.error('Login error:', error);
      showErrorToast('Login failed. Please try again.');
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
            <Text style={styles.greetingTitle}>Welcome Back!</Text>
            <Text style={styles.greetingSubtitle}>Please Sign in to continue.</Text>
          </View>

          {/* Input Fields */}
          <View style={styles.inputsContainer}>
            <InputBox
              label="Email or Username"
              placeholder="Enter your Email or Username"
              value={emailOrUsername}
              setValue={handleEmailChange}
              errorMessage={emailError}
              ref={emailRef}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <InputBox
              label="Password"
              placeholder="********"
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
            <Button1 text="Login" width={'90%'} onPress={handleSignIn} />
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

