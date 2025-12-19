import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

// Register for push notifications and get Expo push token
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Expo Go (Android) no longer supports remote push notifications as of SDK 53.
  // Skip fetching an Expo push token here to avoid runtime warnings/errors.
  // Local notifications + listeners still work in Expo Go.
  const isExpoGo =
    // SDK 49+ (preferred)
    // @ts-ignore - executionEnvironment exists in newer SDKs
    Constants?.executionEnvironment === 'storeClient' ||
    // Fallback for older detection
    Constants?.appOwnership === 'expo';

  if (isExpoGo && Platform.OS === 'android') {
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      // Get project ID from Constants or use fallback
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId || 
                       Constants?.easConfig?.projectId ||
                       '20eb12f7-732f-42ec-b03f-758d24ccf3b2'; // Fallback project ID
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      token = tokenData.data;
      console.log('Expo Push Token:', token);
      
      // Save token to AsyncStorage
      await AsyncStorage.setItem('expoPushToken', token);
      
      return token;
    } catch (e) {
      console.error('Error getting push token:', e);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Send push notification using Expo Push Notification service
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
): Promise<void> {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Notification sent successfully:', result);
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

// Get stored push token from AsyncStorage
export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('expoPushToken');
  } catch (error) {
    console.error('Error getting stored push token:', error);
    return null;
  }
}

// Save push token to backend (you'll need to create this API endpoint)
export async function savePushTokenToBackend(userId: string, token: string): Promise<void> {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('notifications/token');
    
    const authToken = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        user_id: userId,
        push_token: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save push token: ${response.statusText}`);
    }

    console.log('Push token saved to backend successfully');
  } catch (error) {
    console.error('Error saving push token to backend:', error);
    throw error;
  }
}

// Get push token for a user from backend
export async function getUserPushToken(userId: string): Promise<string | null> {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`notifications/token/${userId}`);
    
    const authToken = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Token not found
      }
      throw new Error(`Failed to get push token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.push_token || null;
  } catch (error) {
    console.error('Error getting user push token:', error);
    return null;
  }
}

// Send notification to multiple users
export async function sendNotificationToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: any
): Promise<void> {
  try {
    // Get push tokens for all users
    const pushTokens = await Promise.all(
      userIds.map(userId => getUserPushToken(userId))
    );

    // Filter out null tokens
    const validTokens = pushTokens.filter((token): token is string => token !== null);

    if (validTokens.length === 0) {
      console.log('No valid push tokens found for users');
      return;
    }

    // Send notifications to all valid tokens
    await Promise.all(
      validTokens.map(token => sendPushNotification(token, title, body, data))
    );

    console.log(`Notifications sent to ${validTokens.length} users`);
  } catch (error) {
    console.error('Error sending notifications to users:', error);
    throw error;
  }
}


