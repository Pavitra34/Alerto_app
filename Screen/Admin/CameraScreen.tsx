import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { useFocusEffect, useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
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
import { WebView } from 'react-native-webview';
import { Camera, createCamera, getAllCameras } from '../../api/Camera';
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

type TranslationType = ReturnType<typeof getTranslations>;

interface CameraCardProps {
  camera: Camera;
  thumbnailUri: string | null;
  isLoading: boolean;
  isPlaying: boolean;
  onPress?: () => void;
  onPlayPause?: () => void;
  onDoublePress?: () => void;
  t: TranslationType;
}

const CameraCard: React.FC<CameraCardProps> = ({ camera, thumbnailUri, isLoading, isPlaying, onPress, onPlayPause, onDoublePress, t }) => {
  const videoRef = useRef<Video>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const lastTapRef = useRef<number>(0);
  const isLive = camera.camera_status;
  const isYouTube = camera.camera_view?.includes('youtube.com') || camera.camera_view?.includes('youtu.be');
  
  // Check if it's a local video file - must be exact match or contain 'foodcity_vedio'
  const isLocalVideo = camera.camera_view === 'foodcity_vedio' || 
                       (camera.camera_view && camera.camera_view.trim() === 'foodcity_vedio') ||
                       (camera.camera_view && camera.camera_view.includes('foodcity_vedio') && !camera.camera_view.includes('http'));
  
  // Get video source - handle local vs remote
  const getVideoSource = () => {
    if (isLocalVideo) {
      // Use require() for local video file
      return require('../../assets/images/foodcity_vedio.mp4');
    }
    // For remote videos, use URI
    return { uri: camera.camera_view };
  };

  // Helper function to extract YouTube video ID
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  // Get YouTube embed HTML
  const getYouTubeEmbedHtml = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; background-color: #000; overflow: hidden; }
            .video-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; }
            iframe { width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <div class="video-container">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&playsinline=1&rel=0" 
              allow="autoplay; encrypted-media" 
              allowfullscreen>
            </iframe>
          </div>
        </body>
      </html>
    `;
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setVideoLoading(false);
      setVideoPlaying(status.isPlaying);
    }
  };

  useEffect(() => {
    if (isPlaying && !isYouTube && videoRef.current) {
      setVideoLoading(true);
      videoRef.current.playAsync().catch((error) => {
        console.error('Error playing video:', error);
        setVideoLoading(false);
      });
    } else if (!isPlaying && !isYouTube && videoRef.current) {
      videoRef.current.pauseAsync().catch((error) => {
        console.error('Error pausing video:', error);
      });
    }
  }, [isPlaying, isYouTube, isLocalVideo]);

  // Handle double tap
  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      if (onDoublePress) {
        onDoublePress();
      }
      lastTapRef.current = 0;
    } else {
      // Single tap
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current === now) {
          if (onPress) {
            onPress();
          }
        }
      }, DOUBLE_PRESS_DELAY);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
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
        {/* Camera View - Video Player or Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {isPlaying ? (
            // Show video player when playing
            <>
              {isLocalVideo ? (
                // Local video - use Video component with require()
                <>
                  <Video
                    ref={videoRef}
                    source={require('../../assets/images/foodcity_vedio.mp4')}
                    style={styles.videoPlayer}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={isPlaying}
                    isLooping={false}
                    onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                  />
                  {videoLoading && (
                    <View style={styles.videoLoader}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  )}
                  {/* Play/Pause Button Overlay - Small button in center */}
                  <TouchableOpacity
                    style={styles.playPauseButtonContainer}
                    onPress={onPlayPause}
                    activeOpacity={0.7}>
                    <View style={styles.playPauseButton}>
                      <Text style={styles.playPauseIcon}>
                        {videoPlaying ? '⏸' : '▶'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              ) : isYouTube ? (
                // YouTube video - use WebView
                <WebView
                  source={{ html: getYouTubeEmbedHtml(camera.camera_view) || '' }}
                  style={styles.videoPlayer}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                />
              ) : (
                // Remote video - use Video component with URI
                <>
                  <Video
                    ref={videoRef}
                    source={{ uri: camera.camera_view }}
                    style={styles.videoPlayer}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={isPlaying}
                    isLooping={false}
                    onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                  />
                  {videoLoading && (
                    <View style={styles.videoLoader}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  )}
                  {/* Play/Pause Button Overlay - Small button in center */}
                  <TouchableOpacity
                    style={styles.playPauseButtonContainer}
                    onPress={onPlayPause}
                    activeOpacity={0.7}>
                    <View style={styles.playPauseButton}>
                      <Text style={styles.playPauseIcon}>
                        {videoPlaying ? '⏸' : '▶'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            // Show thumbnail when not playing
            <>
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
            <Video
              source={require('../../assets/images/foodcity_vedio.mp4')}
              style={styles.thumbnail}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isMuted={true}
              isLooping={false}
            />
              )}
              {/* Play Button Overlay on Thumbnail */}
              <TouchableOpacity
                style={styles.playButtonOverlay}
                onPress={onPress}
                activeOpacity={0.7}>
                <View style={styles.playButton}>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
              </TouchableOpacity>
            </>
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
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});
  const [loadingThumbnails, setLoadingThumbnails] = useState<Record<string, boolean>>({});
  const [playingCameraId, setPlayingCameraId] = useState<string | null>(null);
  const [t, setT] = useState(getTranslations('en'));
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const loadLanguage = async () => {
    try {
      const storedLangId = await AsyncStorage.getItem('langId') || 'en';
      setT(getTranslations(storedLangId));
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  // Load cameras from API
  const loadCameras = async () => {
    try {
      setLoading(true);
      const camerasData = await getAllCameras();
      setCameras(camerasData);
      return camerasData;
    } catch (error: unknown) {
      console.error('Error loading cameras:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load cameras';
      showErrorToast(errorMessage);
      setCameras([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Load unread notification count
  const loadUnreadCount = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      if (!storedNotifications) {
        setUnreadCount(0);
        return;
      }
      
      const parsedNotifications = JSON.parse(storedNotifications);
      const userObjString = await AsyncStorage.getItem('userObj');
      let userRole = 'admin';
      
      if (userObjString) {
        const userObj = JSON.parse(userObjString);
        userRole = userObj.role || 'admin';
      }
      
      // Filter notifications based on user role
      let filteredNotifications = parsedNotifications;
      if (userRole === 'employee') {
        filteredNotifications = parsedNotifications.filter((notif: any) => 
          notif.data?.type === 'task_assigned'
        );
      } else if (userRole === 'admin') {
        filteredNotifications = parsedNotifications.filter((notif: any) => 
          notif.data?.type === 'alert_response'
        );
      }
      
      // Count unread notifications
      const unread = filteredNotifications.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  };

  // Add Food City camera with local video if it doesn't exist
  const addFoodCityCameraIfNeeded = async () => {
    try {
      const camerasData = await getAllCameras();
      
      // Check if Food City camera already exists (by camera_view containing 'foodcity_vedio')
      const foodCityCameraExists = camerasData.some(
        (cam) => cam.camera_view?.includes('foodcity_vedio') || 
                 cam.camera_view === 'foodcity_vedio' ||
                 cam.name?.toLowerCase().includes('food city')
      );
      
      if (!foodCityCameraExists) {
        console.log('Adding Food City camera with local video...');
        try {
          // Create Food City camera with local video identifier
          await createCamera(
            'Food City Camera',           // name
            'Store Location',             // location
            true,                         // camera_status (active)
            'foodcity_vedio'              // camera_view (local video identifier)
          );
          console.log('Food City camera added successfully');
          // Reload cameras after adding
          await loadCameras();
        } catch (createError: unknown) {
          // If backend doesn't support creating cameras (404), silently continue
          const isNotFound = createError && typeof createError === 'object' && (
            ('isNotFound' in createError && createError.isNotFound) ||
            ('status' in createError && createError.status === 404) ||
            ('message' in createError && typeof createError.message === 'string' && (
              createError.message.includes('404') || 
              createError.message.includes('not found')
            ))
          );
          
          if (isNotFound) {
            // Silently handle 404 - endpoint doesn't exist, user needs to add manually
            // No console log needed as this is expected behavior
          } else {
            // Only log non-404 errors
            console.error('Error creating Food City camera:', createError);
          }
          // Don't throw - allow app to continue working
        }
      } else {
        console.log('Food City camera already exists');
      }
    } catch (error: unknown) {
      console.error('Error checking/adding Food City camera:', error);
      // Don't show error toast as this is a background operation
      // App should continue working even if this fails
    }
  };

  useEffect(() => {
    loadLanguage();
    loadUnreadCount();
    // Load cameras first, then check and add Food City camera if needed
    loadCameras().then(() => {
      // After loading cameras, check and add Food City camera if needed
      addFoodCityCameraIfNeeded();
    });
    // Reload language when screen is focused (e.g., returning from LanguageScreen)
    const interval = setInterval(() => {
      loadLanguage();
    }, 1000); // Check every second for language changes

    return () => clearInterval(interval);
  }, []);

  // Reload unread count when screen is focused (e.g., returning from notification screen)
  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [])
  );

  // Disable Android hardware back button on this screen
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => backHandler.remove();
    }, [])
  );

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  // Helper function to get YouTube thumbnail URL
  const getYouTubeThumbnail = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;
    
    // Use YouTube's thumbnail API
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Generate thumbnails for all cameras
  useEffect(() => {
    const generateThumbnails = async () => {
      if (!cameras || cameras.length === 0) return;
      
      for (const camera of cameras) {
        if (camera.camera_view && !thumbnails[camera._id]) {
          setLoadingThumbnails((prev) => ({ ...prev, [camera._id]: true }));
          try {
            // Check if it's a YouTube URL
            const isYouTube = camera.camera_view.includes('youtube.com') || camera.camera_view.includes('youtu.be');
            
            // Check if it's a local video file - must be exact match or contain 'foodcity_vedio' without http
            const isLocalVideo = camera.camera_view === 'foodcity_vedio' || 
                                 (camera.camera_view && camera.camera_view.trim() === 'foodcity_vedio') ||
                                 (camera.camera_view && camera.camera_view.includes('foodcity_vedio') && !camera.camera_view.includes('http'));
            
            if (isYouTube) {
              // Use YouTube thumbnail
              const youtubeThumbnail = getYouTubeThumbnail(camera.camera_view);
              if (youtubeThumbnail) {
                setThumbnails((prev) => ({ ...prev, [camera._id]: youtubeThumbnail }));
              } else {
                // Fallback if YouTube ID extraction fails
                setThumbnails((prev) => ({ ...prev, [camera._id]: null }));
              }
            } else if (isLocalVideo) {
              // For local video files, skip thumbnail generation (expo-video-thumbnails doesn't work well with require())
              // Set null - will show placeholder, video will still play when clicked
              setThumbnails((prev) => ({ ...prev, [camera._id]: null }));
            } else {
              // For remote non-YouTube videos, try to generate thumbnail
          try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(camera.camera_view, {
              time: 1000, // Get thumbnail at 1 second
              quality: 0.7,
            });
            setThumbnails((prev) => ({ ...prev, [camera._id]: uri }));
              } catch (videoError) {
                // If thumbnail generation fails, try to use the URL directly as image
                setThumbnails((prev) => ({ ...prev, [camera._id]: camera.camera_view }));
              }
            }
          } catch (error) {
            console.error('Error generating thumbnail for camera:', camera._id, error);
            // Try to use the URL directly as fallback
            setThumbnails((prev) => ({ ...prev, [camera._id]: camera.camera_view }));
          } finally {
            setLoadingThumbnails((prev) => ({ ...prev, [camera._id]: false }));
          }
        }
      }
    };

    generateThumbnails();
  }, [cameras, t]);

  const handleCameraPress = (camera: Camera) => {
    // Toggle video playback for this camera
    if (playingCameraId === camera._id) {
      // If this camera is playing, stop it
      setPlayingCameraId(null);
    } else {
      // If another camera is playing, stop it and play this one
      setPlayingCameraId(camera._id);
    }
  };

  const handlePlayPause = (cameraId: string) => {
    if (playingCameraId === cameraId) {
      setPlayingCameraId(null);
    } else {
      setPlayingCameraId(cameraId);
    }
  };

  const handleDoublePress = (camera: Camera) => {
    // Navigate to full screen camera view
    router.push({
      pathname: '/camera-view',
      params: {
        cameraId: camera._id,
        cameraName: camera.name,
        cameraView: camera.camera_view || '',
        cameraLocation: camera.location,
        cameraStatus: camera.camera_status.toString(),
      },
    });
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
        <View style={styles.headerWrapper}>
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
              onPress: () => router.push('/admin-notifications'),
            }}
          />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading cameras...</Text>
          </View>
        ) : !cameras || cameras.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cameras found</Text>
          </View>
        ) : (
        <View style={styles.gridContainer}>
            {cameras.map((camera) => (
            <CameraCard
              key={camera._id}
              camera={camera}
              thumbnailUri={thumbnails[camera._id] || null}
              isLoading={loadingThumbnails[camera._id] || false}
              isPlaying={playingCameraId === camera._id}
              onPress={() => handleCameraPress(camera)}
              onPlayPause={() => handlePlayPause(camera._id)}
              onDoublePress={() => handleDoublePress(camera)}
              t={t}
            />
          ))}
        </View>
        )}
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
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 20,
    color: '#000000',
    marginLeft: 3,
  },
  playPauseButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseIcon: {
    fontSize: 16,
    color: '#FFFFFF',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    color: colors.subtext,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    color: colors.subtext,
  },
  headerWrapper: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 15,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
    zIndex: 10,
  },
  notificationBadgeText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fonts.family.medium,
    lineHeight: 12,
  },
});

