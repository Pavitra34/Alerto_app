# Footer_A Component - Usage Guide

## Overview

`Footer_A.tsx` is a navigation footer component specifically designed for admin users in the Alerto app. It provides 5 navigation options with active/inactive icon states.

## Component Structure

### Icons Used

| Feature | Active Icon | Non-active Icon | Route |
|---------|------------|-----------------|-------|
| Home | `home_b.png` | `home_g.png` | `/admin` |
| Camera | `camera_b.png` | `camera_g.png` | `/camera` |
| Alerts | `alert_b.png` | `alert_g.png` | `/alerts` |
| Users | `users_b.png` | `users_g.png` | `/users` |
| More/Profile | `more_b.png` | `more_g.png` | `/profile` |

### Navigation Routes

All routes navigate to admin screens:
- **Home** → `Screen/Admin/AdminScreen.tsx`
- **Camera** → `Screen/Admin/CameraScreen.tsx`
- **Alerts** → `Screen/Admin/AlertScreen.tsx`
- **Users** → `Screen/Admin/UsersScreen.tsx`
- **More/Profile** → `Screen/Admin/ProfileScreen.tsx` (for admin users)

## Usage in Admin Screens

### Example: AdminScreen.tsx

```tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Header from '../../components/common/Header';
import Footer_A from '../Footer_A';
import colors from '../../styles/Colors';
// @ts-ignore
import fonts from '../../styles/Fonts';

export default function AdminScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header Component - REQUIRED for all admin screens */}
      <Header
        center={{
          type: 'text',
          value: 'Alerto',
        }}
        right={{
          type: 'image',
          url: require('../../assets/icons/notification.png'),
          width: 24,
          height: 24,
        }}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Your screen content */}
      </ScrollView>
      
      {/* Footer_A Component - REQUIRED for all admin screens */}
      <Footer_A />
    </SafeAreaView>
  );
}
```

### Example: CameraScreen.tsx

```tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Header from '../../components/common/Header';
import Footer_A from '../Footer_A';
import colors from '../../styles/Colors';
// @ts-ignore
import fonts from '../../styles/Fonts';

export default function CameraScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header
        center={{
          type: 'text',
          value: 'Cameras',
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Camera management content */}
      </ScrollView>
      <Footer_A />
    </SafeAreaView>
  );
}
```

## Role-Based Footer Navigation

### Automatic Role Detection

The app automatically determines which footer to show based on user role:

- **Admin users** → `Footer_A` component
- **Employee users** → `Footer` component

### Implementation Options

#### Option 1: Using the RoleBasedFooter Hook

```tsx
import { useRoleBasedFooter } from '../utils/roleBasedNavigation';

export default function YourScreen() {
  const FooterComponent = useRoleBasedFooter();
  
  return (
    <SafeAreaView style={styles.container}>
      <Header ... />
      <ScrollView>...</ScrollView>
      <FooterComponent />
    </SafeAreaView>
  );
}
```

#### Option 2: Using the RoleBasedFooter Component

```tsx
import RoleBasedFooter from '../utils/roleBasedNavigation';

export default function YourScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header ... />
      <ScrollView>...</ScrollView>
      <RoleBasedFooter />
    </SafeAreaView>
  );
}
```

#### Option 3: Manual Role Check

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { findUserById } from '../api/users';
import Footer from '../Screen/Footer';
import Footer_A from '../Screen/Footer_A';

export default function YourScreen() {
  const [userRole, setUserRole] = useState<string>('employee');

  useEffect(() => {
    const loadUserRole = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        const user = findUserById(storedUserId);
        if (user) {
          setUserRole(user.role);
        }
      }
    };
    loadUserRole();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header ... />
      <ScrollView>...</ScrollView>
      {userRole === 'admin' ? <Footer_A /> : <Footer />}
    </SafeAreaView>
  );
}
```

## Route Configuration

All admin routes are configured in `app/_layout.tsx`:

```tsx
<Stack.Screen name="admin" options={{ headerShown: false }} />
<Stack.Screen name="camera" options={{ headerShown: false, animation: 'none' }} />
<Stack.Screen name="alerts" options={{ headerShown: false, animation: 'none' }} />
<Stack.Screen name="users" options={{ headerShown: false, animation: 'none' }} />
<Stack.Screen name="profile" options={{ headerShown: false, animation: 'none' }} />
```

## Profile Route Role-Awareness

The `/profile` route automatically detects the user role and renders the appropriate screen:

- **Admin users** → `Screen/Admin/ProfileScreen.tsx`
- **Employee users** → `Screen/Staff/profilescreen.tsx`

This is handled in `app/profile.tsx` automatically.

## Key Requirements

1. ✅ **All admin screens MUST use `Header` component** from `components/common/Header.tsx`
2. ✅ **All admin screens MUST use `Footer_A` component** from `Screen/Footer_A.tsx`
3. ✅ **Icons must be in `assets/icons/` directory** with the correct naming convention
4. ✅ **Active route detection** is handled automatically based on current route segments
5. ✅ **Role-based navigation** ensures correct footer is shown based on user role

## Styling

The Footer_A component uses `StyleSheet.create` (no inline styles) and follows the same styling pattern as the employee Footer component:

- Position: Absolute at bottom
- Background: `colors.secondary` (white)
- Border: Top border with `colors.border`
- Shadow: Subtle shadow for elevation
- Icons: 24x24px with proper spacing

## Icon Handling Logic

Icons automatically switch between active (blue) and inactive (grey) states:

- **Active route**: Uses `*_b.png` (blue) icons
- **Inactive route**: Uses `*_g.png` (grey) icons

The active state is determined by comparing the current route segment with the footer navigation routes.

