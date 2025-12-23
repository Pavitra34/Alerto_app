import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

const FlashScreen = () => {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        // Check if user is already logged in
        const authToken = await AsyncStorage.getItem('authToken');
        const userObjString = await AsyncStorage.getItem('userObj');
        const langId = await AsyncStorage.getItem('langId');

        console.log('\n🔍 ========== AUTO-LOGIN CHECK ==========');
        console.log('🔑 Auth Token:', authToken ? '✅ Found' : '❌ Not found');
        console.log('👤 User Data:', userObjString ? '✅ Found' : '❌ Not found');
        console.log('🌐 Language:', langId || 'Not set');

        // Wait for 2 seconds to show splash screen
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (authToken && userObjString) {
          // User is logged in, navigate to appropriate screen based on role
          const userObj = JSON.parse(userObjString);
          const role = userObj.role;

          console.log('✅ Auto-login: Navigating to', role === 'admin' ? 'Admin' : 'Employee', 'screen');
          console.log('=========================================\n');

          if (role === 'admin') {
            router.replace('/admin');
          } else {
            router.replace('/employee');
          }
        } else {
          // No auth token, check if language is set
          console.log('❌ No auth token: Navigating to', langId ? 'Login' : 'Language', 'screen');
          console.log('=========================================\n');

          if (langId) {
            // Language already set, go to login
            router.replace('/login');
          } else {
            // First time user, go to language selection
            router.replace('/language');
          }
        }
      } catch (error) {
        console.error('❌ Error during auto-login check:', error);
        // On error, navigate to language screen
        router.replace('/language');
      }
    };

    checkAuthAndNavigate();
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.spinnerWrapper}>
        <ActivityIndicator size="large" color="#4A90F2" />
      </View>
    </View>
  );
};

export default FlashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  logo: {
    alignSelf: 'center',
    marginTop: '60%',
    width: 143,
    height: 83,
  },
  spinnerWrapper: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
