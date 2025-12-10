import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, findCameraById } from '../../api/Camera';
import { EmployeeActive, findEmployeeActiveByUserId, getActiveEmployees } from '../../api/Employee_active';
import { ReportMessageEntry, Task, dummyTasks, findTasksByThreatId } from '../../api/Tasks';
import { Threat, dummyThreats, getUnassignedThreats } from '../../api/Threat';
import { User, findUserById } from '../../api/users';
import { getTranslations } from '../../assets/Translation';
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
  activeTab: TabType;
  assignedEmployees?: Array<{ user: User | undefined; employeeActive?: EmployeeActive | undefined }>;
  task?: Task | undefined;
  reportMessages?: ReportMessageEntry[];
  onAssignPress: (threat: Threat) => void;
  onReassignPress: (threat: Threat) => void;
}

const AlertCard: React.FC<AlertCardProps & { t: any }> = ({
  threat,
  camera,
  activeTab,
  assignedEmployees,
  task,
  reportMessages,
  onAssignPress,
  onReassignPress,
  t,
}) => {
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
        return '#FF0000';
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
      paddingTop={12}
      paddingBottom={12}
      paddingRight={12}
      paddingLeft={12}
      marginBottom={12}
      alignItems="flex-start">
      {/* Header Section */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.threatType}>{getThreatTypeDisplay(threat.threat_type)}</Text>
          <Text style={styles.cameraName}>{camera?.name || t.unknownCamera}</Text>
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
          <Text style={styles.locationText}>{camera?.location || t.unknownLocation}</Text>
        </View>
        <View style={styles.locationSection}>
        <Image
            source={require('../../assets/icons/clock_g.png')}
            style={styles.locationIcon}
            resizeMode="contain"
          />
         <Text style={styles.timestamp}>{formatDate(threat.createdat)}</Text>
         </View>
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
          {activeTab === 'reviewed' && task?.review_status ? (
            <View style={styles.reviewedBadge}>
              <Text style={styles.badgeText}>{t.reviewed}</Text>
            </View>
          ) : threat.threat_status ? (
            <View style={styles.assignedBadge}>
              <Text style={styles.badgeText}>{t.assigned}</Text>
            </View>
          ) : (
            <View style={styles.unassignedBadge}>
              <Text style={styles.badgeText}>{t.unreviewed}</Text>
            </View>
          )}
          <View style={[styles.levelBadge, { backgroundColor: getThreatLevelColor(threat.threat_level) }]}>
            <Text style={styles.levelBadgeText}>{threat.threat_level}</Text>
          </View>
        </View>
      </View>

      {/* Reviewed Section - Show report messages for reviewed tasks */}
      {activeTab === 'reviewed' && task?.review_status && reportMessages && reportMessages.length > 0 && (
        <>
          {reportMessages.map((report, index) => {
            const employee = assignedEmployees?.find((emp) => emp.user?.id === report.user_id);
            const employeeName = employee?.user?.fullname || t.unknown;
            return (
              <CartBox
                key={index}
                width="100%"
                borderRadius={10}
                borderWidth={0}
                backgroundColor={colors.status_active}
                paddingTop={8}
                paddingBottom={8}
                paddingRight={8}
                paddingLeft={8}
                marginBottom={8}
                alignItems="flex-start">                
                  <View>
                    <Text style={styles.reviewedStaffText}>
                      {t.assignedStaff} {employeeName}
                    </Text>
                    <Text style={styles.reportMessageText}>
                      {t.report} {report.message}
                    </Text>
                  </View>
                  <View style={styles.reportCardContent}>
                  <Text style={styles.reportTimeText}>
                    {new Date(report.reviewed_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </Text>
                  </View>
                
              </CartBox>
            );
          })}
        </>
      )}

      {/* Assigned Staff Section - Show individual cards for each assigned employee */}
      {activeTab === 'assigned' && threat.threat_status && assignedEmployees && assignedEmployees.length > 0 && (
        <>
          {assignedEmployees.map((emp, index) => {
            const employeeName = emp.user?.fullname || t.unknown;
            const employeeActive = emp.employeeActive;
            return (
              <CartBox
                key={index}
                width="100%"
                height={32}
                borderRadius={10}
                borderWidth={0}
                backgroundColor={colors.assigned_staff}
                paddingTop={8}
                paddingBottom={8}
                paddingRight={8}
                paddingLeft={8}
                marginBottom={12}
                alignItems="flex-start">
                    <Text style={styles.assignedStaffCardName} ellipsizeMode="tail" numberOfLines={1}>
                      {t.assignedStaff} {employeeName}
                    </Text>
              </CartBox>
            );
          })}
        </>
      )}

      {/* Assign/Reassign Button - Hide for reviewed tab */}
      {activeTab !== 'reviewed' && (
        threat.threat_status ? (
          <Button1
            text={t.reassign}
            onPress={() => onReassignPress(threat)}
            backgroundColor={colors.secondary}
            textStyle={styles.assignButtontext}
            width="100%"
            containerStyle={styles.assignButton}
          />
        ) : (
          <Button1
            text={t.assign}
            onPress={() => onAssignPress(threat)}
            backgroundColor={colors.secondary}
            textStyle={styles.assignButtontext}
            width="100%"
            containerStyle={styles.assignButton}
          />
        )
      )}

    </CartBox>
  );
};

interface AssignModalProps {
  visible: boolean;
  threat: Threat | null;
  activeEmployees: Array<EmployeeActive & { user: User | undefined }>;
  preSelectedUserIds?: string[];
  onClose: () => void;
  onAssign: (threatId: string, userIds: string[]) => void;
}

const AssignModal: React.FC<AssignModalProps & { t: any }> = ({
  visible,
  threat,
  activeEmployees,
  preSelectedUserIds = [],
  onClose,
  onAssign,
  t,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(preSelectedUserIds);

  // Update selectedUserIds when preSelectedUserIds changes (when modal opens with different threat)
  useEffect(() => {
    if (visible) {
      setSelectedUserIds(preSelectedUserIds);
    } else {
      setSelectedUserIds([]);
    }
  }, [visible, preSelectedUserIds]);

  const toggleEmployeeSelection = (userId: string) => {
    setSelectedUserIds((prevSelected) => {
      if (prevSelected.includes(userId)) {
        // Unselect if already selected
        return prevSelected.filter((id) => id !== userId);
      } else {
        // Select if not already selected
        return [...prevSelected, userId];
      }
    });
  };

  const handleAssign = () => {
    if (threat && selectedUserIds.length > 0) {
      onAssign(threat._id, selectedUserIds);
      setSelectedUserIds([]);
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
            <Text style={styles.modalTitle}>{t.assignStaff}</Text>
          </View>

          {/* Employee List */}
          <ScrollView style={styles.employeeList} showsVerticalScrollIndicator={false}>
            {activeEmployees.map((emp) => (
              <TouchableOpacity
                key={emp._id}
                style={[
                  styles.employeeRow,
                  selectedUserIds.includes(emp.user_id) && styles.employeeRowSelected,
                ]}
                onPress={() => toggleEmployeeSelection(emp.user_id)}>
                <Text style={styles.employeeName}>{emp.user?.fullname || t.unknown}</Text>
                <View style={[
                  styles.statusBadge,
                  emp.active_status ? styles.statusBadgeActive : styles.statusBadgeInactive,
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {emp.active_status ? t.active : t.inactive}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Assign Button */}
          <Button1
            text={t.assign}
            onPress={handleAssign}
            backgroundColor={colors.primary}
            width="100%"
            height={39}
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [t, setT] = useState(getTranslations('en'));

  const loadLanguage = async () => {
    try {
      const storedLangId = await AsyncStorage.getItem('langId') || 'en';
      setT(getTranslations(storedLangId));
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  useEffect(() => {
    loadLanguage();
    // Reload language when screen is focused (e.g., returning from LanguageScreen)
    const interval = setInterval(() => {
      loadLanguage();
    }, 1000); // Check every second for language changes

    return () => clearInterval(interval);
  }, []);

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
        return dummyThreats.filter((threat) => threat.threat_status === true);
      case 'reviewed':
        return dummyThreats.filter((threat) => {
          const task = dummyTasks.find((task) => task.threat_id === threat._id);
          return task && task.review_status === true;
        });
      default:
        return [];
    }
  }, [activeTab, refreshKey]);

  const handleAssignPress = (threat: Threat) => {
    setSelectedThreat(threat);
    setAssignModalVisible(true);
  };

  const handleAssign = (threatId: string, userIds: string[]) => {
    // In a real app, this would be an API call
    // For reassignment: Remove old tasks and create new ones
    const existingTasks = dummyTasks.filter((task) => task.threat_id === threatId);
    existingTasks.forEach((task) => {
      const index = dummyTasks.findIndex((taskItem) => taskItem._id === task._id);
      if (index !== -1) {
        dummyTasks.splice(index, 1);
      }
    });

    // Create a single task with all selected user_ids
    const newTask: Task = {
      _id: `task${Date.now()}_${threatId}`,
      threat_id: threatId,
      user_ids: userIds,
      review_status: false,
      report_message: null, // null when review_status is false
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };

    // Add task to dummyTasks (in real app, this would be an API call)
    dummyTasks.push(newTask);

    // Update threat status (in real app, this would be an API call)
    const threat = dummyThreats.find((threatItem) => threatItem._id === threatId);
    if (threat) {
      threat.threat_status = true;
      threat.updatedat = new Date().toISOString();
    }

    // Refresh the view by updating state
    setRefreshKey((prev) => prev + 1);
    setAssignModalVisible(false);
    setSelectedThreat(null);
  };

  const handleReassignPress = (threat: Threat) => {
    // Get currently assigned employees for this threat
    const assignedTasks = findTasksByThreatId(threat._id);
    // Flatten all user_ids from all tasks into a single array
    const assignedUserIds = assignedTasks.flatMap((task) => task.user_ids);
    
    setSelectedThreat(threat);
    setAssignModalVisible(true);
    // Pre-select will be handled by the modal's useEffect
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
            value: t.alertAndEvents,
          }}
          right={{
            type: 'image',
            url: require('../../assets/icons/notification.png'),
            width: 24,
            height: 24,
          }}
        />
      </SafeAreaView>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Button1
          text={t.unreviewed}
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
          text={t.assigned}
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
          text={t.reviewed}
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
            <Text style={styles.emptyText}>{t.noAlertsFound}</Text>
          </View>
        ) : (
          filteredThreats.map((threat) => {
            const camera = findCameraById(threat.camera_id);
            // Get assigned employees for this threat
            const assignedTasks = findTasksByThreatId(threat._id);
            // Flatten all user_ids from all tasks and get unique users
            const allUserIds = assignedTasks.flatMap((task) => task.user_ids);
            const uniqueUserIds = Array.from(new Set(allUserIds));
            const assignedEmployees = uniqueUserIds.map((userId) => {
              const user = findUserById(userId);
              const employeeActive = findEmployeeActiveByUserId(userId);
              return { user, employeeActive };
            });
            
            // Get task and report messages for reviewed tab
            const task = assignedTasks.find((taskItem) => taskItem.review_status === true) || assignedTasks[0];
            const reportMessages = task?.review_status && task?.report_message ? task.report_message : undefined;
            
            return (
              <AlertCard
                key={threat._id}
                threat={threat}
                camera={camera}
                activeTab={activeTab}
                assignedEmployees={assignedEmployees}
                task={task}
                reportMessages={reportMessages}
                onAssignPress={handleAssignPress}
                onReassignPress={handleReassignPress}
                t={t}
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
        preSelectedUserIds={
          selectedThreat
            ? findTasksByThreatId(selectedThreat._id).flatMap((task) => task.user_ids)
            : []
        }
        onClose={() => {
          setAssignModalVisible(false);
          setSelectedThreat(null);
        }}
        onAssign={handleAssign}
        t={t}
      />
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16.5,
    marginHorizontal: 4,
    height:39
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
    paddingHorizontal: 20,
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
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  threatType: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.medium,
    color: colors.text,
    marginBottom: 5,
  },
  cameraName: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.text,
  },
  thumbnailContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#000000',
    marginBottom: 10,
    borderRadius:10
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
    borderRadius:10
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent:"space-between",
    position: 'absolute',
    paddingVertical:13,
    paddingHorizontal:15,
    width:"100%"
  },
  unassignedBadge: {
    backgroundColor: colors.live_badge,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 10,
  },
  assignedBadge: {
    backgroundColor: colors.assigned_staff,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 10,
  },
  reviewedBadge: {
    backgroundColor: colors.status_active,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  levelBadge: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 10,
  },
  levelBadgeText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
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
    justifyContent:"space-between",
    marginBottom:10,
    width:"100%",
  },
    timestamp: {
    fontSize: fonts.size.s,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext,
  },
  locationIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: fonts.size.s,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext,
  },
  assignButton:{  
    width:"100%",
    borderWidth:2,
    borderColor:colors.primary
  },
  assignButtontext: {
    color: colors.primary,
    paddingVertical: 10,
  },
  assignedStaffCardName: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.secondary,
    width:"100%",
  },
  reportCardContent: {
    width: '100%',
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  reviewedStaffText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.secondary,
  },
  reportMessageText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.secondary,
  },
  reportTimeText: {
    fontSize: fonts.size.xs,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '80%',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderLine: {
    width: 40,
    height: 6,
    backgroundColor: colors.modal_line,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: fonts.size.l,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.semibold,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth:1,
    borderRadius:12,
    backgroundColor:colors.secondary,
    borderColor:colors.border,
    marginBottom:12,
    height:41,
  },
  employeeRowSelected: {
    borderWidth:2,
    borderColor:colors.popupBorderColor,
  },
  employeeName: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 5.5 ,
    borderRadius: 10,
    minHeight:23,
    minWidth:42,
    alignItems:"center"
  },
  statusBadgeActive: {
    backgroundColor: colors.status_active,
  },
  statusBadgeInactive: {
    backgroundColor: colors.live_badge,
  },
  statusBadgeText: {
    fontSize: fonts.size.xs,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  modalAssignButton: {
    marginTop: 10,
  },
});
