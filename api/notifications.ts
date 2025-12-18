// Notification API functions

// Save push token for a user
export interface SavePushTokenResponse {
  success: boolean;
  message: string;
  data?: {
    user_id: string;
    push_token: string;
  };
}

export const savePushToken = async (userId: string, pushToken: string): Promise<void> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('notifications/token');
    
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const authToken = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      body: JSON.stringify({
        user_id: userId,
        push_token: pushToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: SavePushTokenResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to save push token');
    }
  } catch (error: any) {
    console.error('Save push token API error:', error);
    throw error;
  }
};

// Get push token for a user
export interface GetPushTokenResponse {
  success: boolean;
  message: string;
  data?: {
    user_id: string;
    push_token: string;
  };
}

export const getUserPushToken = async (userId: string): Promise<string | null> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`notifications/token/${userId}`);
    
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const authToken = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Token not found
      }
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetPushTokenResponse = await response.json();
    
    if (data.success && data.data) {
      return data.data.push_token;
    }
    
    return null;
  } catch (error: any) {
    console.error('Get user push token API error:', error);
    return null;
  }
};

// Send notification via backend (backend will handle sending to Expo Push Notification service)
export interface SendNotificationResponse {
  success: boolean;
  message: string;
}

export const sendNotificationToUser = async (
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('notifications/send');
    
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const authToken = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      body: JSON.stringify({
        user_id: userId,
        title,
        body,
        data: data || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const result: SendNotificationResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to send notification');
    }
  } catch (error: any) {
    console.error('Send notification API error:', error);
    throw error;
  }
};

// Send notification to multiple users
export const sendNotificationToUsers = async (
  userIds: string[],
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('notifications/send-multiple');
    
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const authToken = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      body: JSON.stringify({
        user_ids: userIds,
        title,
        body,
        data: data || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const result: SendNotificationResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to send notifications');
    }
  } catch (error: any) {
    console.error('Send notifications to users API error:', error);
    throw error;
  }
};

