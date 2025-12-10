import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, dummyCameras } from '../../api/Camera';
import { getTranslations } from '../../assets/Translation';
import CartBox from '../../components/common/CartBox';
import Header from '../../components/common/Header';
import Toast, { showErrorToast, toastConfig } from '../../components/common/Toast';
import colors from '../../styles/Colors';
import fonts from '../../styles/Fonts';
import Footer_A from '../Footer_A';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN =20;
const CARD_PADDING = 20;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_MARGIN) / 2;

interface CameraCardProps {
  camera: Camera;
  thumbnailUri: string | null;
  isLoading: boolean;
  onPress?: () => void;
  t: any;
}

const CameraCard: React.FC<CameraCardProps> = ({ camera, thumbnailUri, isLoading, onPress, t }) => {
  const isLive = camera.camera_status;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.cardContainer}>
      <CartBox
        width={CARD_WIDTH}
        borderRadius={10}
        backgroundColor={colors.background}
        paddingTop={0}
        paddingBottom={12}
        paddingHorizontal={0}
        marginBottom={12}
        alignItems="flex-start"
      >
        {/* Camera View Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {isLoading ? (
            <View style={styles.thumbnailLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          {/* Live Badge Overlay */}
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{t.live}</Text>
            </View>
          )}
        </View>

        {/* Camera Details */}
        <View style={styles.cameraDetails}>
          <Text style={styles.cameraName} numberOfLines={1}>
            {camera.name}
          </Text>
          <View style={styles.locationContainer}>
            <Image
              source={require('../../assets/icons/location_g.png')}
              style={styles.locationIcon}
              resizeMode="contain"
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {camera.location}
            </Text>
          </View>
        </View>
      </CartBox>
    </TouchableOpacity>
  );
};

export default function CameraScreen() {
  const router = useRouter();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loadingThumbnails, setLoadingThumbnails] = useState<Record<string, boolean>>({});
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

  // Generate thumbnails for all cameras
  useEffect(() => {
    const generateThumbnails = async () => {
      for (const camera of dummyCameras) {
        if (camera.camera_view && !thumbnails[camera._id]) {
          setLoadingThumbnails((prev) => ({ ...prev, [camera._id]: true }));
          try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(camera.camera_view, {
              time: 1000, // Get thumbnail at 1 second
              quality: 0.7,
            });
            setThumbnails((prev) => ({ ...prev, [camera._id]: uri }));
          } catch (error) {
            // Show error toast when thumbnail generation fails
            showErrorToast(t?.unableToLoadCameraPreview || 'Unable to load camera preview');
          } finally {
            setLoadingThumbnails((prev) => ({ ...prev, [camera._id]: false }));
          }
        }
      }
    };

    generateThumbnails();
  }, [t]);

  const handleCameraPress = (camera: Camera) => {
    router.push({
      pathname: '/camera-view',
      params: {
        cameraId: camera._id,
        cameraName: camera.name,
        cameraView: camera.camera_view,
        cameraLocation: camera.location,
        cameraStatus: camera.camera_status.toString(),
      },
    } as any);
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
            value: t.camera,
          }}
          right={{
            type: 'image',
            url: require('../../assets/icons/notification.png'),
            width: 24,
            height: 24,
          }}
        />
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {dummyCameras.map((camera) => (
            <CameraCard
              key={camera._id}
              camera={camera}
              thumbnailUri={thumbnails[camera._id] || null}
              isLoading={loadingThumbnails[camera._id] || false}
              onPress={() => handleCameraPress(camera)}
              t={t}
            />
          ))}
        </View>
      </ScrollView>
      <Footer_A />
      <Toast config={toastConfig} />
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
    padding: CARD_PADDING,
    paddingBottom: 100,
    marginTop: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    marginBottom:8,
  },
  thumbnailContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    backgroundColor: colors.background,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailLoader: {
    width: '100%',
    height: '100%',
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
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.live_badge,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  liveDot: {
    width: 3,
    height: 3,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginRight: 3.5,
  },
  liveText: {
    fontSize: 8,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  cameraDetails: {
    padding: 12,
    width: '100%',
  },
  cameraName: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.text,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
  },
});

