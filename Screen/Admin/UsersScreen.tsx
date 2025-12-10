import React, { useState, useMemo, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Animated,
  PanResponder,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import SearchBar from '../../components/common/SearchBar';
import CartBox from '../../components/common/CartBox';
import { Button1 } from '../../components/common/Button';
import Footer_A from '../Footer_A';
import colors from '../../styles/Colors';
// @ts-ignore
import fonts from '../../styles/Fonts';
import { dummyUsers, User } from '../../api/users';
import { dummyEmployeeActive } from '../../api/Employee_active';

interface UserWithStatus extends User {
  activeStatus: boolean | null; // null if no active status found
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function UsersScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | null>(null);
  const [tempSelectedStatus, setTempSelectedStatus] = useState<'active' | 'inactive' | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  
  // Default FAB position
  const defaultFabPosition = { x: SCREEN_WIDTH - 100, y: SCREEN_HEIGHT - 140 };
  
  // FAB position state
  const pan = useRef(new Animated.ValueXY()).current;
  const [fabPosition, setFabPosition] = useState(defaultFabPosition);
  const panStart = useRef({ x: 0, y: 0 });

  // Combine users with their active status (only employees, current date only)
  const usersWithStatus: UserWithStatus[] = useMemo(() => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Filter only employees (not admin or superadmin)
    const employees = dummyUsers.filter((user) => user.role === 'employee');
    
    return employees.map((user) => {
      // Find all active status entries for this user
      const allActiveStatuses = dummyEmployeeActive.filter(
        (emp) => emp.user_id === user.id
      );
      
      // Find the entry that matches today's date
      const todayActiveStatus = allActiveStatuses.find((emp) => {
        const empDate = new Date(emp.updatedat).toISOString().split('T')[0];
        return empDate === today;
      });
      
      return {
        ...user,
        activeStatus: todayActiveStatus ? todayActiveStatus.active_status : null,
      };
    });
  }, []);

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
    console.log('Add user pressed');
    // Add user functionality here
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload user data - the useMemo will automatically recalculate
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // PanResponder for dragging FAB - smoother implementation
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panStart.current = { x: fabPosition.x, y: fabPosition.y };
        // Reset pan values for smooth start
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (evt, gestureState) => {
        // Direct smooth movement without bounds checking during drag
        pan.setValue({
          x: gestureState.dx,
          y: gestureState.dy,
        });
      },
      onPanResponderRelease: (evt, gestureState) => {
        const newX = panStart.current.x + gestureState.dx;
        const newY = panStart.current.y + gestureState.dy;
        
        // Keep FAB within screen bounds
        const maxX = SCREEN_WIDTH - 60;
        const maxY = SCREEN_HEIGHT - 170;
        const minX = 0;
        const minY = 100;
        
        const boundedX = Math.max(minX, Math.min(maxX, newX));
        const boundedY = Math.max(minY, Math.min(maxY, newY));
        
        // Animate to final position smoothly
        Animated.spring(pan, {
          toValue: { 
            x: boundedX - fabPosition.x, 
            y: boundedY - fabPosition.y 
          },
          useNativeDriver: false,
          tension: 50,
          friction: 7,
        }).start(() => {
          setFabPosition({ x: boundedX, y: boundedY });
          pan.setValue({ x: 0, y: 0 });
        });
      },
    })
  ).current;

  // Reset FAB position to default on mount (refresh)
  useEffect(() => {
    setFabPosition(defaultFabPosition);
    pan.setValue({ x: 0, y: 0 });
  }, []);

  const getInitials = (name: string): string => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (activeStatus: boolean | null): string => {
    if (activeStatus === true) {
      return '#0DBEA0'; // Green for Active
    } else {
      return '#FF0000'; // Red for Inactive (both false and null)
    }
  };

  const getStatusText = (activeStatus: boolean | null): string => {
    if (activeStatus === true) {
      return 'Active';
    } else {
      return 'Inactive'; // Both false and null show as Inactive
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
            value: 'Users',
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
          placeholder="Search by name"
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
        {filteredUsers.map((user) => (
          <View key={user.id} style={styles.userItemWrapper}>
            <CartBox
              width="100%"
              height={60}
              borderRadius={12}
              borderWidth={1}
              borderColor={colors.border}>
              <View style={styles.userItem}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(user.fullname)}</Text>
                </View>
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
          </View>
        ))}
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
            <Text style={styles.modalTitle}>Status</Text>
            
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
                  Active
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
                  Inactive
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Select Button */}
            <Button1
              text="Select"
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
      <Animated.View
        style={[
          styles.fab,
          {
            left: fabPosition.x,
            bottom: SCREEN_HEIGHT - fabPosition.y,
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
            ],
          },
        ]}
        {...panResponder.panHandlers}>
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
      </Animated.View>

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
    paddingVertical: 12,
    gap: 12,
    marginBottom:20
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
    width: 18,
    height: 18,
    tintColor: colors.secondary,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userItemWrapper: {
    marginBottom: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingLeft: 8
    ,
    paddingRight: 16,
  },
  avatarContainer: {
    marginRight: 8,
    
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 25,
    backgroundColor: '#7D8FAB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  userInfo: {
    flex: 1,
    maxWidth: '50%',
    marginRight: 12,
    minWidth: 0,
  },
  userName: {
    fontSize: 14,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext2,
    maxWidth: '100%',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 51,
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 20,
  },
  statusText: {
    fontSize: 12,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  fab: {
    position: 'absolute',
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
});
