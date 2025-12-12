import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllCameras, getActiveCameras } from '../../api/Camera';
import { getAllEmployeeActiveStatuses } from '../../api/employeeActive';
import { getAllThreats } from '../../api/Threat';
import { getUsersByRole, User } from '../../api/users';
import { getTranslations } from '../../assets/Translation';
import CartBox from '../../components/common/CartBox';
import Header from '../../components/common/Header';
import colors from '../../styles/Colors';
import Footer_A from '../Footer_A';
// @ts-ignore
import fonts from '../../styles/Fonts';

interface MetricCardProps {
  icon: any;
  label: string;
  value: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value }) => {
  return (
    <CartBox
      width="100%"
      borderRadius={10}
      borderWidth={1}
      borderColor={colors.border}
      backgroundColor={colors.secondary}
      marginBottom={12}
      alignItems="center"
      justifyContent="space-between"
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardLabel}>{label}</Text>
          <Text style={styles.cardValue}>{value}</Text>
        </View>
        <Image source={icon} style={styles.cardIcon} resizeMode="contain" />
      </View>
    </CartBox>
  );
};

export default function AdminScreen() {
  const [t, setT] = useState(getTranslations('en'));
  const [employees, setEmployees] = useState<User[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [threats, setThreats] = useState<any[]>([]);
  const [employeeActiveStatuses, setEmployeeActiveStatuses] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalNVROnline: '12/13',
    cameraOnline: '0/0',
    todayAlertsCount: '0',
    storageHealth: '87%',
    activeStaff: '0/0',
  });

  const loadLanguage = async () => {
    try {
      const storedLangId = await AsyncStorage.getItem('langId') || 'en';
      setT(getTranslations(storedLangId));
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const employeeUsers = await getUsersByRole('employee');
      setEmployees(employeeUsers);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    }
  };

  const loadCameras = async () => {
    try {
      const camerasData = await getAllCameras();
      setCameras(camerasData);
    } catch (error) {
      console.error('Error loading cameras:', error);
      setCameras([]);
    }
  };

  const loadEmployeeActiveStatuses = async () => {
    try {
      const statuses = await getAllEmployeeActiveStatuses();
      setEmployeeActiveStatuses(statuses);
    } catch (error) {
      console.error('Error loading employee active statuses:', error);
      setEmployeeActiveStatuses([]);
    }
  };

  const loadThreats = async () => {
    try {
      const threatsData = await getAllThreats();
      setThreats(threatsData);
    } catch (error) {
      console.error('Error loading threats:', error);
      setThreats([]);
    }
  };

  useEffect(() => {
    loadLanguage();
    loadEmployees();
    loadCameras();
    loadEmployeeActiveStatuses();
    loadThreats();
    // Reload language when screen is focused (e.g., returning from LanguageScreen)
    const interval = setInterval(() => {
      loadLanguage();
    }, 1000); // Check every second for language changes

    return () => clearInterval(interval);
  }, []);

  // Calculate metrics
  useEffect(() => {
    if (!cameras || !employees || !employeeActiveStatuses || !threats) {
      return; // Wait for data to load
    }

    // Camera Online: Count of cameras where camera_status: true / total cameras
    const activeCameras = cameras.filter((cam) => cam.camera_status === true);
    const totalCameras = cameras.length || 0;
    const cameraOnline = `${activeCameras.length}/${totalCameras}`;

    // Today's Total Alerts: Count of Threat objects where createdat is today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAlerts = (threats || []).filter((threat) => {
      if (!threat || !threat.createdat) return false;
      const threatDate = new Date(threat.createdat);
      threatDate.setHours(0, 0, 0, 0);
      return threatDate.getTime() === today.getTime();
    });
    const todayAlertsCount = todayAlerts.length.toString();

    // Active Staff: Count of Employee_active where active_status: true AND role: employee
    const activeStaffWithEmployeeRole = employeeActiveStatuses.filter((emp) => {
      if (emp.active_status !== true) return false;
      const user = employees.find((u) => u.id === emp.user_id);
      return user && user.role === 'employee';
    });
    const activeStaffCount = activeStaffWithEmployeeRole.length;

    // Total Staff: Count of employees from API with role: employee
    const totalStaff = employees.length || 0;

    // Total NVR Online: Dummy number
    const totalNVROnline = '12/13';

    // Storage Health: Dummy percentage
    const storageHealth = '87%';

    setMetrics({
      totalNVROnline,
      cameraOnline,
      todayAlertsCount,
      storageHealth,
      activeStaff: `${activeStaffCount}/${totalStaff}`,
    });
  }, [cameras, employees, employeeActiveStatuses, threats]);

  return (
    <View style={styles.container}>
      {Platform.OS === 'android' && (
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.secondary}
          translucent={false}
        />
      )}
      <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
        <Header
          center={{
            type: 'text',
            value: t.headerTitle,
          }}
          right={{
            type: 'image',
            url: require('../../assets/icons/notification.png'),
            width: 24,
            height: 24,
          }}
        />
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MetricCard
          icon={require('../../assets/icons/nvr_b.png')}
          label={t.totalNVROnline}
          value={metrics.totalNVROnline}
        />
        <MetricCard
          icon={require('../../assets/icons/cam_b.png')}
          label={t.cameraOnline}
          value={metrics.cameraOnline}
        />
        <MetricCard
          icon={require('../../assets/icons/alertH_b.png')}
          label={t.todaysTotalAlerts}
          value={metrics.todayAlertsCount}
        />
        <MetricCard
          icon={require('../../assets/icons/storage_b.png')}
          label={t.storageHealth}
          value={metrics.storageHealth}
        />
        <MetricCard
          icon={require('../../assets/icons/usersH_b.png')}
          label={t.activeStaff}
          value={metrics.activeStaff}
        />
      </ScrollView>
      <Footer_A />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  safeAreaTop: {
    backgroundColor: colors.secondary,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding:12,
  },
  cardLeft: {
    flex: 1,
  },
  cardIcon: {
    width: 16,
    height: 16,
  },
  cardLabel: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.search,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: fonts.size.xxl,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.medium,
    color: colors.dateboxborder,
  },
});

