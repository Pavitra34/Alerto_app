import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AdminProfileScreen from '../Screen/Admin/ProfileScreen';
import ProfileScreen from '../Screen/Staff/profilescreen';

export default function ProfileRoute() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        // Get user data from AsyncStorage (saved during login from backend)
        const userObjString = await AsyncStorage.getItem('userObj');
        
        if (userObjString) {
          const userObj = JSON.parse(userObjString);
          // Get role from backend user data
          if (userObj.role) {
            setUserRole(userObj.role);
          } else {
            setUserRole('employee'); // Default to employee
          }
        } else {
          setUserRole('employee'); // Default to employee
        }
      } catch (error) {
        console.error('Error loading user role:', error);
        setUserRole('employee'); // Default to employee on error
      } finally {
        setIsLoading(false);
      }
    };

    loadUserRole();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Render Admin ProfileScreen for admin users, Staff ProfileScreen for employees
  return userRole === 'admin' ? <AdminProfileScreen /> : <ProfileScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

