import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar as RNStatusBar } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {/* Expo StatusBar for iOS and cross-platform */}
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
