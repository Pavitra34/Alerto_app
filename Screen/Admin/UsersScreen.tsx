import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllEmployeeActiveStatuses } from '../../api/employeeActive';
import { getUsersByRole, User } from '../../api/users';
import { getTranslations } from '../../assets/Translation';
import { Button1 } from '../../components/common/Button';
import CartBox from '../../components/common/CartBox';
import Header from '../../components/common/Header';
import SearchBar from '../../components/common/SearchBar';
import colors from '../../styles/Colors';
import fonts from '../../styles/Fonts';
import Footer_A from '../Footer_A';

interface UserWithStatus extends User {
  activeStatus: boolean | null; // null if no active status found
}

export default function UsersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | null>(null);
  const [tempSelectedStatus, setTempSelectedStatus] = useState<'active' | 'inactive' | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [employees, setEmployees] = useState<User[]>([]);
  const [employeeActiveStatuses, setEmployeeActiveStatuses] = useState<Map<string, boolean>>(new Map());
  const [t, setT] = useState(getTranslations('en'));
  const insets = useSafeAreaInsets();

  const loadLanguage = async () => {
    try {
      const storedLangId = await AsyncStorage.getItem('langId') || 'en';
      setT(getTranslations(storedLangId));
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  // Load employees from API
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employeeUsers = await getUsersByRole('employee');
      setEmployees(employeeUsers);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Load employee active statuses from API
  const loadEmployeeActiveStatuses = async () => {
    try {
      const statuses = await getAllEmployeeActiveStatuses();
      // Create a map for quick lookup: user_id -> active_status
      const statusMap = new Map<string, boolean>();
      statuses.forEach(status => {
        statusMap.set(status.user_id, status.active_status);
      });
      setEmployeeActiveStatuses(statusMap);
    } catch (error) {
      console.error('Error loading employee active statuses:', error);
      setEmployeeActiveStatuses(new Map());
    }
  };

  useEffect(() => {
    loadLanguage();
    loadEmployees();
    loadEmployeeActiveStatuses();
    // Reload language when screen is focused (e.g., returning from LanguageScreen)
    const interval = setInterval(() => {
      loadLanguage();
    }, 1000); // Check every second for language changes

    return () => clearInterval(interval);
  }, []);

  // Combine users with their active status from database
  const usersWithStatus: UserWithStatus[] = useMemo(() => {
    // Safety check for employees array
    if (!employees || employees.length === 0) {
      return [];
    }

    return employees.map((user) => {
      // Get active status from API data (statusMap)
      const activeStatus = employeeActiveStatuses.get(user.id);
      
      return {
        ...user,
        activeStatus: activeStatus !== undefined ? activeStatus : null,
      };
    });
  }, [employees, employeeActiveStatuses]);

  // Filter users based on search query and status
  const filteredUsers = useMemo(() => {
    let filtered = usersWithStatus;

    // Filter by status
    if (selectedStatus === 'active') {
      filtered = filtered.filter((user) => user.activeStatus === true);
    } else if (selectedStatus === 'inactive') {
      filtered = filtered.filter((user) => user.activeStatus === false || user.activeStatus === null);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.fullname.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [usersWithStatus, searchQuery, selectedStatus]);

  const handleFilterPress = () => {
    // Initialize temp status with current selected status
    setTempSelectedStatus(selectedStatus);
    setShowFilterModal(true);
  };

  const handleCloseFilterModal = () => {
    // Close modal without applying filter
    setShowFilterModal(false);
    setTempSelectedStatus(null);
  };

  const handleStatusSelect = (status: 'active' | 'inactive') => {
    // Update temporary status (not the actual filter)
    setTempSelectedStatus(status);
  };

  const handleApplyFilter = () => {
    // Apply the filter only when Select button is clicked
    setSelectedStatus(tempSelectedStatus);
    setShowFilterModal(false);
    setTempSelectedStatus(null);
  };

  const handleAddUser = () => {
    router.push('/adduser');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload employees and active statuses from API
      await Promise.all([
        loadEmployees(),
        loadEmployeeActiveStatuses()
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getInitials = (name: string): string => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (activeStatus: boolean | null): string => {
    if (activeStatus === true) {
      return colors.status_active; // Green for Active
    } else {
      return colors.live_badge; // Red for Inactive (both false and null)
    }
  };

  const getStatusText = (activeStatus: boolean | null): string => {
    if (activeStatus === true) {
      return t.active;
    } else {
      return t.inactive; // Both false and null show as Inactive
    }
  };

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
            value: t.users,
          }}
          right={{
            type: 'image',
            url: require('../../assets/icons/notification.png'),
            width: 24,
            height: 24,
            onPress: () => console.log('Notification pressed'),
          }}
        />
      </SafeAreaView>

      <View style={styles.searchBarContainer}>
        <SearchBar
          placeholder={t.searchByName}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleFilterPress}
          activeOpacity={0.7}>
          <Image
            source={require('../../assets/icons/filter1.png')}
            style={styles.filterIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No employees found</Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
          <TouchableOpacity
            key={user.id}
            activeOpacity={0.7}
            onPress={() => {
              // Ensure activeStatus is properly passed as string ('true' or 'false')
              const activeStatusValue = user.activeStatus === true ? 'true' : 'false';
              router.push({
                pathname: '/user-profile' as any,
                params: {
                  userId: user.id,
                  activeStatus: activeStatusValue,
                },
              } as any);
            }}>
            <CartBox
              width="100%"
              height={60}
              borderRadius={10}
              borderWidth={0}
              marginBottom={12}
              >

              <View style={styles.userItem}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(user.fullname)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.fullname}</Text>
                  <Text
                    style={styles.userEmail}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {user.email}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(user.activeStatus) },
                ]}>
                <Text style={styles.statusText}>
                  {getStatusText(user.activeStatus)}
                </Text>
              </View>
            </View>
          </CartBox>
          </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseFilterModal}>
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCloseFilterModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Title */}
            <Text style={styles.modalTitle}>{t.status}</Text>

            {/* Status Options */}
            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  tempSelectedStatus === 'active' && styles.statusOptionSelected,
                ]}
                onPress={() => handleStatusSelect('active')}
                activeOpacity={0.7}>
                <Text style={[
                  styles.statusOptionText,
                  tempSelectedStatus === 'active' && styles.statusOptionTextSelected,
                ]}>
                  {t.active}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusOption,
                  tempSelectedStatus === 'inactive' && styles.statusOptionSelected,
                ]}
                onPress={() => handleStatusSelect('inactive')}
                activeOpacity={0.7}>
                <Text style={[
                  styles.statusOptionText,
                  tempSelectedStatus === 'inactive' && styles.statusOptionTextSelected,
                ]}>
                  {t.inactive}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Select Button */}
            <Button1
              text={t.select}
              width="100%"
              onPress={handleApplyFilter}
              backgroundColor={colors.primary}
              height={39}
              containerStyle={styles.selectButton}
              textStyle={styles.selectButtonText}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Floating Action Button */}
      <View style={styles.fab}>
        <TouchableOpacity
          onPress={handleAddUser}
          activeOpacity={0.8}
          style={styles.fabTouchable}>
          <Image
            source={require('../../assets/icons/floting1.png')}
            style={styles.fabIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.footerWrapper}>
        <Footer_A />
      </SafeAreaView>
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 8,
    marginBottom: 20
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    width: 16,
    height: 16,
    tintColor: colors.secondary,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userItem: {
    width: "100%",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: "space-between",
    paddingHorizontal:12,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 25,
    backgroundColor: colors.button_text,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight:8,
  },
  avatarText: {
    fontSize: fonts.size.s,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.secondary,
  },
  userInfo: {
    maxWidth:"90%"
  },
  userName: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.text,
    marginBottom: 6,
    maxWidth: '80%',
  },
  userEmail: {
    fontSize: fonts.size.s,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext,
    maxWidth: '80%',
    minWidth:150,
    width:"100%",
  },
  statusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 5.5,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 140,
    width: 60,
    height: 60,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
  fabTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    width: 31.2,
    height: 31.2,
    tintColor: colors.secondary,
  },
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.secondary,
  },
  modalOverlay: {
    flex: 1,

    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 30,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.family.bold,
    fontWeight: fonts.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  statusOptions: {
    marginBottom: 24,
  },
  statusOption: {
    height: 41,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,

    marginBottom: 12,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  statusOptionSelected: {
    borderColor: colors.primary,

  },
  statusOptionText: {
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.text,
  },
  statusOptionTextSelected: {
    color: colors.text,
  },
  selectButton: {
    marginTop: 8,
  },
  selectButtonText: {
    color: colors.secondary,
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    color: colors.subtext,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    color: colors.subtext,
  },
});
