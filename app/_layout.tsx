import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { StatusBar as RNStatusBar } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Global notification listener to save notifications
let globalNotificationListener: Notifications.Subscription | null = null;
let globalResponseListener: Notifications.Subscription | null = null;

// Function to save notification to AsyncStorage
const saveNotificationToStorage = async (notification: Notifications.Notification) => {
  try {
    const notificationItem = {
      id: notification.request.identifier || `notif_${Date.now()}_${Math.random()}`,
      title: notification.request.content.title || '',
      body: notification.request.content.body || '',
      data: notification.request.content.data || {},
      date: new Date().toISOString(), // Store as ISO string
      read: false,
    };

    const storedNotifications = await AsyncStorage.getItem('notifications');
    const existingNotifications = storedNotifications ? JSON.parse(storedNotifications) : [];
    
    // Check if notification already exists (avoid duplicates)
    const exists = existingNotifications.some((n: any) => 
      n.id === notificationItem.id || 
      (n.title === notificationItem.title && 
       n.body === notificationItem.body && 
       Math.abs(new Date(n.date).getTime() - new Date(notificationItem.date).getTime()) < 5000)
    );

    if (!exists) {
      // Add new notification at the beginning
      const updatedNotifications = [notificationItem, ...existingNotifications];
      
      // Keep only last 100 notifications
      const limitedNotifications = updatedNotifications.slice(0, 100);
      
      await AsyncStorage.setItem('notifications', JSON.stringify(limitedNotifications));
      console.log('Notification saved to storage:', notificationItem.title);
    }
  } catch (error) {
    console.error('Error saving notification to storage:', error);
  }
};

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    // Configure system UI for Android
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync(isDark ? '#000000' : '#ffffff');
    }

    // Set up global notification listeners
    // Listen for notifications received while app is in foreground or background
    globalNotificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received globally:', notification.request.content.title);
      saveNotificationToStorage(notification);
    });

    // Listen for notification taps (when user taps on notification)
    globalResponseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped globally:', response.notification.request.content.title);
      saveNotificationToStorage(response.notification);
    });

    // Cleanup on unmount
    return () => {
      if (globalNotificationListener) {
        globalNotificationListener.remove();
        globalNotificationListener = null;
      }
      if (globalResponseListener) {
        globalResponseListener.remove();
        globalResponseListener = null;
      }
    };
  }, [isDark]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {/* React Native StatusBar for Android */}
      {Platform.OS === 'android' && (
        <RNStatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? '#000000' : '#ffffff'}
          translucent={false}
        />
      )}
      <Stack
        screenOptions={{
          animation: 'none',
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="language" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="camera-view" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="alerts" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="users" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="employee" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="history" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="profile" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="helpcenter" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="about" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="termsofservice" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="privacypolicy" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="adduser" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="user-profile" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="admin-notifications" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {/* Expo StatusBar for iOS and cross-platform */}
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
