import React, { useMemo } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { dummyCameras, getActiveCameras } from '../../api/Camera';
import { getActiveEmployees } from '../../api/Employee_active';
import { dummyThreats } from '../../api/Threat';
import { dummyUsers } from '../../api/users';
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
  // Calculate metrics
  const metrics = useMemo(() => {
    // Camera Online: Count of cameras where camera_status: true / total cameras
    const activeCameras = getActiveCameras();
    const totalCameras = dummyCameras.length;
    const cameraOnline = `${activeCameras.length}/${totalCameras}`;

    // Today's Total Alerts: Count of Threat objects where createdat is today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAlerts = dummyThreats.filter((threat) => {
      const threatDate = new Date(threat.createdat);
      threatDate.setHours(0, 0, 0, 0);
      return threatDate.getTime() === today.getTime();
    });
    const todayAlertsCount = todayAlerts.length.toString();

    // Active Staff: Count of Employee_active where active_status: true AND role: employee
    const activeEmployees = getActiveEmployees();
    const activeStaffWithEmployeeRole = activeEmployees.filter((emp) => {
      const user = dummyUsers.find((u) => u.id === emp.user_id);
      return user && user.role === 'employee';
    });
    const activeStaffCount = activeStaffWithEmployeeRole.length;

    // Total Staff: Count of employees from users.ts with role: employee
    const totalStaff = dummyUsers.filter((user) => user.role === 'employee').length;

    // Total NVR Online: Dummy number
    const totalNVROnline = '12/13';

    // Storage Health: Dummy percentage
    const storageHealth = '87%';

    return {
      totalNVROnline,
      cameraOnline,
      todayAlertsCount,
      storageHealth,
      activeStaff: `${activeStaffCount}/${totalStaff}`,
    };
  }, []);

  return (
    <View style={styles.container}>
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MetricCard
          icon={require('../../assets/icons/nvr_b.png')}
          label="Total NVR Online"
          value={metrics.totalNVROnline}
        />
        <MetricCard
          icon={require('../../assets/icons/cam_b.png')}
          label="Camera online"
          value={metrics.cameraOnline}
        />
        <MetricCard
          icon={require('../../assets/icons/alertH_b.png')}
          label="Today's total alerts"
          value={metrics.todayAlertsCount}
        />
        <MetricCard
          icon={require('../../assets/icons/storage_b.png')}
          label="Storage health"
          value={metrics.storageHealth}
        />
        <MetricCard
          icon={require('../../assets/icons/usersH_b.png')}
          label="Active staff"
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
    paddingTop:20,
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

