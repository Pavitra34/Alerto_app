import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../styles/Colors';

interface Footer_AProps {
  onNavigate?: (route: string, params?: any) => void;
}

export default function Footer_A({ onNavigate }: Footer_AProps) {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const [langId, setLangId] = useState<string>('en');
  const [userId, setUserId] = useState<string>('');
  const [activeRoute, setActiveRoute] = useState<string>('/admin');

  useEffect(() => {
    // Get language_id and user_id from AsyncStorage
    const loadData = async () => {
      try {
        const storedLangId = await AsyncStorage.getItem('langId');
        const storedUserId = await AsyncStorage.getItem('userId');
        
        if (storedLangId) {
          setLangId(storedLangId);
        }
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('Error loading footer data:', error);
      }
    };

    loadData();
    
    // Update active route based on current segments
    if (segments && segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      // Map segments to routes
      if (lastSegment === 'admin') {
        setActiveRoute('/admin');
      } else if (lastSegment === 'camera') {
        setActiveRoute('/camera');
      } else if (lastSegment === 'alerts') {
        setActiveRoute('/alerts');
      } else if (lastSegment === 'users') {
        setActiveRoute('/users');
      } else if (lastSegment === 'profile') {
        setActiveRoute('/profile');
      }
    }
  }, [segments]);

  const handleNavigation = (route: string) => {
    const params = {
      langId: langId,
      userId: userId,
    };

    console.log('Footer_A Navigation:', { route, langId, userId });

    setActiveRoute(route);

    if (onNavigate) {
      onNavigate(route, params);
    } else {
      // Use replace instead of push to avoid slide animation
      router.replace({
        pathname: route as any,
        params: params,
      } as any);
    }
  };

  const isActive = (route: string) => {
    return activeRoute === route;
  };

  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleNavigation('/admin')}>
        <Image
          source={
            isActive('/admin')
              ? require('../assets/icons/home_b.png')
              : require('../assets/icons/home_g.png')
          }
          style={styles.navIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleNavigation('/camera')}>
        <Image
          source={
            isActive('/camera')
              ? require('../assets/icons/camera_b.png')
              : require('../assets/icons/camera_g.png')
          }
          style={styles.navIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleNavigation('/alerts')}>
        <Image
          source={
            isActive('/alerts')
              ? require('../assets/icons/alert_b.png')
              : require('../assets/icons/alert_g.png')
          }
          style={styles.navIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleNavigation('/users')}>
        <Image
          source={
            isActive('/users')
              ? require('../assets/icons/users_b.png')
              : require('../assets/icons/users_g.png')
          }
          style={styles.navIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleNavigation('/profile')}>
        <Image
          source={
            isActive('/profile')
              ? require('../assets/icons/more_b.png')
              : require('../assets/icons/more_g.png')
          }
          style={styles.navIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: Platform.OS === 'ios' ? 20 : 15,
    backgroundColor: colors.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  navIcon: {
    width: 28,
    height: 28,
  },
});

