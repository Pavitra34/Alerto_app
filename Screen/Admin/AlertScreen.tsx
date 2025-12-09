import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, findCameraById } from '../../api/Camera';
import { EmployeeActive, getActiveEmployees } from '../../api/Employee_active';
import { Task, dummyTasks } from '../../api/Tasks';
import { Threat, dummyThreats, getUnassignedThreats } from '../../api/Threat';
import { User, findUserById } from '../../api/users';
import { Button1 } from '../../components/common/Button';
import CartBox from '../../components/common/CartBox';
import Header from '../../components/common/Header';
import colors from '../../styles/Colors';
import Footer_A from '../Footer_A';
// @ts-ignore
import fonts from '../../styles/Fonts';

type TabType = 'unreviewed' | 'assigned' | 'reviewed';

interface AlertCardProps {
  threat: Threat;
  camera: Camera | undefined;
  onAssignPress: (threat: Threat) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ threat, camera, onAssignPress }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const getThreatLevelColor = (level: string): string => {
    switch (level) {
      case 'High':
        return '#FF3B30';
      case 'Medium':
        return '#FF9500';
      case 'Low':
        return '#34C759';
      default:
        return colors.subtext;
    }
  };

  const getThreatTypeDisplay = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <CartBox
      width="100%"
      borderRadius={12}
      borderWidth={0}
      backgroundColor={colors.background}
      paddingTop={0}
      paddingBottom={12}
      paddingRight={12}
      paddingLeft={12}
      marginBottom={12}
      alignItems="flex-start">
      {/* Header Section */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.threatType}>{getThreatTypeDisplay(threat.threat_type)}</Text>
          <Text style={styles.cameraName}>{camera?.name || 'Unknown Camera'}</Text>
        </View>
      </View>
      {/* Camera Location Section */}
      <View style={styles.locationSection1}>
        <View style={styles.locationSection}>
          <Image
            source={require('../../assets/icons/location_g.png')}
            style={styles.locationIcon}
            resizeMode="contain"
          />
          <Text style={styles.locationText}>{camera?.location || 'Unknown Location'}</Text>
        </View>
         <Text style={styles.timestamp}>{formatDate(threat.createdat)}</Text>
      </View>

      {/* Video Thumbnail Section */}
      <View style={styles.thumbnailContainer}>
        {imageLoading && !imageError && (
          <View style={styles.thumbnailLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
        {!imageError ? (
          <Image
            source={{ uri: camera?.camera_view }}
            style={styles.thumbnail}
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {/* Badges Overlay */}
        <View style={styles.badgesContainer}>
          <View style={styles.unassignedBadge}>
            <Text style={styles.badgeText}>Unreviewed</Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: getThreatLevelColor(threat.threat_level) }]}>
            <Text style={styles.levelBadgeText}>{threat.threat_level}</Text>
          </View>
        </View>
      </View>

      {/* Assign Button */}
      <View style={styles.assignButtonContainer}>
        <Button1
          text="Assign"
          onPress={() => onAssignPress(threat)}
          backgroundColor={colors.primary}
          width="100%"
          height={40}
        />
      </View>
    </CartBox>
  );
};

interface AssignModalProps {
  visible: boolean;
  threat: Threat | null;
  activeEmployees: Array<EmployeeActive & { user: User | undefined }>;
  onClose: () => void;
  onAssign: (threatId: string, userId: string) => void;
}

const AssignModal: React.FC<AssignModalProps> = ({
  visible,
  threat,
  activeEmployees,
  onClose,
  onAssign,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleAssign = () => {
    if (threat && selectedUserId) {
      onAssign(threat._id, selectedUserId);
      setSelectedUserId(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLine} />
            <Text style={styles.modalTitle}>Assign staff</Text>
          </View>

          {/* Employee List */}
          <ScrollView style={styles.employeeList} showsVerticalScrollIndicator={false}>
            {activeEmployees.map((emp) => (
              <TouchableOpacity
                key={emp._id}
                style={[
                  styles.employeeRow,
                  selectedUserId === emp.user_id && styles.employeeRowSelected,
                ]}
                onPress={() => setSelectedUserId(emp.user_id)}>
                <Text style={styles.employeeName}>{emp.user?.fullname || 'Unknown'}</Text>
                <View style={[
                  styles.statusBadge,
                  emp.active_status ? styles.statusBadgeActive : styles.statusBadgeInactive,
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {emp.active_status ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Assign Button */}
          <Button1
            text="Assign"
            onPress={handleAssign}
            backgroundColor={colors.primary}
            width="100%"
            height={50}
            containerStyle={styles.modalAssignButton}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default function AlertScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('unreviewed');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);

  // Get active employees with user details
  const activeEmployeesWithUsers = useMemo(() => {
    const activeEmps = getActiveEmployees();
    return activeEmps.map((emp) => ({
      ...emp,
      user: findUserById(emp.user_id),
    }));
  }, []);

  // Filter threats based on active tab
  const filteredThreats = useMemo(() => {
    switch (activeTab) {
      case 'unreviewed':
        return getUnassignedThreats();
      case 'assigned':
        return dummyThreats.filter((t) => t.threat_status === true);
      case 'reviewed':
        return dummyThreats.filter((t) => {
          const task = dummyTasks.find((task) => task.threat_id === t._id);
          return task && task.review_status === true;
        });
      default:
        return [];
    }
  }, [activeTab]);

  const handleAssignPress = (threat: Threat) => {
    setSelectedThreat(threat);
    setAssignModalVisible(true);
  };

  const handleAssign = (threatId: string, userId: string) => {
    // In a real app, this would be an API call
    // For now, we'll simulate creating a Task and updating threat status
    const newTask: Task = {
      _id: `task${Date.now()}`,
      threat_id: threatId,
      user_id: userId,
      review_status: false,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };

    // Update threat status (in real app, this would be an API call)
    const threat = dummyThreats.find((t) => t._id === threatId);
    if (threat) {
      threat.threat_status = true;
      threat.updatedat = new Date().toISOString();
    }

    // Add task to dummyTasks (in real app, this would be an API call)
    dummyTasks.push(newTask);

    // Refresh the view by updating state
    setAssignModalVisible(false);
    setSelectedThreat(null);
  };

  return (
    <View style={styles.container}>
      <Header
        center={{
          type: 'text',
          value: 'Alert & Events',
        }}
        right={{
          type: 'image',
          url: require('../../assets/icons/notification.png'),
          width: 24,
          height: 24,
        }}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Button1
          text="Unreviewed"
          onPress={() => setActiveTab('unreviewed')}
          backgroundColor={activeTab === 'unreviewed' ? colors.primary : colors.secondary}
          width="31%"
          height={36}
          border={activeTab !== 'unreviewed'}
          containerStyle={styles.tabButton}
          textStyle={
            activeTab === 'unreviewed'
              ? styles.tabButtonTextActive
              : styles.tabButtonText
          }
        />
        <Button1
          text="Assigned"
          onPress={() => setActiveTab('assigned')}
          backgroundColor={activeTab === 'assigned' ? colors.primary : colors.secondary}
          width="31%"
          height={36}
          border={activeTab !== 'assigned'}
          containerStyle={styles.tabButton}
          textStyle={
            activeTab === 'assigned'
              ? styles.tabButtonTextActive
              : styles.tabButtonText
          }
        />
        <Button1
          text="Reviewed"
          onPress={() => setActiveTab('reviewed')}
          backgroundColor={activeTab === 'reviewed' ? colors.primary : colors.secondary}
          width="31%"
          height={36}
          border={activeTab !== 'reviewed'}
          containerStyle={styles.tabButton}
          textStyle={
            activeTab === 'reviewed'
              ? styles.tabButtonTextActive
              : styles.tabButtonText
          }
        />
      </View>

      {/* Alert Cards List */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {filteredThreats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No alerts found</Text>
          </View>
        ) : (
          filteredThreats.map((threat) => {
            const camera = findCameraById(threat.camera_id);
            return (
              <AlertCard
                key={threat._id}
                threat={threat}
                camera={camera}
                onAssignPress={handleAssignPress}
              />
            );
          })
        )}
      </ScrollView>

      <Footer_A />

      {/* Assign Modal */}
      <AssignModal
        visible={assignModalVisible}
        threat={selectedThreat}
        activeEmployees={activeEmployeesWithUsers}
        onClose={() => {
          setAssignModalVisible(false);
          setSelectedThreat(null);
        }}
        onAssign={handleAssign}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingTop: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginTop: 20,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16.5,
    marginHorizontal: 4,
  },
  tabButtonText: {
    fontSize: fonts.size.l,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.medium,
    color: colors.subtext,
    paddingVertical: 10,
  },
  tabButtonTextActive: {
    fontSize: fonts.size.l,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
    paddingVertical: 10,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: fonts.size.l,
    fontFamily: fonts.family.regular,
    color: colors.subtext,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    marginTop: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  threatType: {
    fontSize: fonts.size.l,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.text,
    marginBottom: 4,
  },
  cameraName: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext2,
  },
  timestamp: {
    fontSize: fonts.size.s,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext2,
    marginLeft: 8,
  },
  thumbnailContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#000000',
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  badgesContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unassignedBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  levelBadgeText: {
    fontSize: 10,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationSection1: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal:12
  },
  locationIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  locationText: {
    fontSize: fonts.size.s,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext2,
    flex: 1,
  },
  assignButtonContainer: {
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderLine: {
    width: 40,
    height: 4,
    backgroundColor: colors.modal_line,
    borderRadius: 2,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: fonts.size.xl,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.text,
  },
  employeeList: {
    maxHeight: 400,
    marginBottom: 20,
  },
  employeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  employeeRowSelected: {
    backgroundColor: colors.button_background,
  },
  employeeName: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: colors.status_early_bg,
  },
  statusBadgeInactive: {
    backgroundColor: colors.status_late_bg,
  },
  statusBadgeText: {
    fontSize: fonts.size.s,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.status_early,
  },
  modalAssignButton: {
    marginTop: 10,
  },
});
