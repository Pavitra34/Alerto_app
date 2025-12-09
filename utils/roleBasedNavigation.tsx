/**
 * Role-Based Navigation Example
 * 
 * This file demonstrates how to conditionally render Footer components
 * based on user role (admin vs employee).
 * 
 * Usage in your screens:
 * 
 * import { useRoleBasedFooter } from '../utils/roleBasedNavigation';
 * 
 * export default function YourScreen() {
 *   const FooterComponent = useRoleBasedFooter();
 *   
 *   return (
 *     <SafeAreaView style={styles.container}>
 *       <Header ... />
 *       <ScrollView>...</ScrollView>
 *       <FooterComponent />
 *     </SafeAreaView>
 *   );
 * }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import Footer from '../Screen/Footer';
import Footer_A from '../Screen/Footer_A';
import { findUserById } from '../api/users';

/**
 * Custom hook to determine which footer component to use based on user role
 * @returns Footer component (Footer_A for admin, Footer for employee)
 */
export function useRoleBasedFooter() {
  const [userRole, setUserRole] = useState<string>('employee');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        
        if (storedUserId) {
          const user = findUserById(storedUserId);
          if (user && user.role) {
            setUserRole(user.role);
          }
        }
      } catch (error) {
        console.error('Error loading user role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserRole();
  }, []);

  // Return Footer_A for admin, Footer for employee
  if (isLoading) {
    // Return default footer while loading
    return Footer;
  }

  return userRole === 'admin' ? Footer_A : Footer;
}

/**
 * Alternative approach: Direct component that handles role-based rendering
 * 
 * Usage:
 * import RoleBasedFooter from '../utils/roleBasedNavigation';
 * 
 * <RoleBasedFooter />
 */
export default function RoleBasedFooter() {
  const [userRole, setUserRole] = useState<string>('employee');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        
        if (storedUserId) {
          const user = findUserById(storedUserId);
          if (user && user.role) {
            setUserRole(user.role);
          }
        }
      } catch (error) {
        console.error('Error loading user role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserRole();
  }, []);

  if (isLoading) {
    return <Footer />;
  }

  return userRole === 'admin' ? <Footer_A /> : <Footer />;
}

