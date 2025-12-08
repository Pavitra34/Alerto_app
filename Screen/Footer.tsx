import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import colors from '../styles/Colors';

interface FooterProps {
  onNavigate?: (route: string, params?: any) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const router = useRouter();
  const segments = useSegments();
  const [langId, setLangId] = useState<string>('en');
  const [userId, setUserId] = useState<string>('');
  const [activeRoute, setActiveRoute] = useState<string>('/employee');

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
      setActiveRoute('/' + segments[segments.length - 1]);
    }
  }, [segments]);

  const handleNavigation = (route: string) => {
    const params = {
      langId: langId,
      userId: userId,
    };

    console.log('Footer Navigation:', { route, langId, userId });

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
    <View style={styles.footer}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleNavigation('/employee')}>
        <Image
          source={require('../assets/icons/home.png')}
          style={[
            styles.navIcon,
            isActive('/employee') && styles.navIconActive,
          ]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleNavigation('/history')}>
        <Image
          source={require('../assets/icons/history.png')}
          style={[
            styles.navIcon,
            isActive('/history') && styles.navIconActive,
          ]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleNavigation('/profile')}>
        <Image
          source={require('../assets/icons/profile.png')}
          style={[
            styles.navIcon,
            isActive('/profile') && styles.navIconActive,
          ]}
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
    paddingVertical: 15,
    paddingBottom: 30,
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
    width: 24,
    height: 24,
    tintColor: colors.footer_inactive,
  },
  navIconActive: {
    tintColor: '#4A90F2',
  },
});

