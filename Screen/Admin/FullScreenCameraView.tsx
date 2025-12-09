import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../styles/Colors';
// @ts-ignore
import fonts from '../../styles/Fonts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FullScreenCameraView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cameraId = params.cameraId as string;
  const cameraName = params.cameraName as string;
  const cameraView = params.cameraView as string;
  const cameraLocation = params.cameraLocation as string;
  const cameraStatus = params.cameraStatus === 'true';

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleBack = () => {
    if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
    router.back();
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setIsLoading(false);
    } else if (status.error) {
      console.error('Video playback error:', status.error);
      setIsLoading(false);
    }
  };

  const clearControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  }, []);

  const hideControlsAfterDelay = useCallback(() => {
    clearControlsTimeout();
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying, clearControlsTimeout]);

  const toggleControls = () => {
    setShowControls(true);
    hideControlsAfterDelay();
  };

  useEffect(() => {
    // Auto-hide controls when playing starts
    if (isPlaying && showControls) {
      hideControlsAfterDelay();
    }
    return () => {
      clearControlsTimeout();
    };
  }, [isPlaying, showControls, hideControlsAfterDelay, clearControlsTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearControlsTimeout();
    };
  }, [clearControlsTimeout]);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* Video Player */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleControls}
        style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: cameraView }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
        
        {/* Loading Spinner */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            {/* Play/Pause Button - Only show when paused or when controls are visible */}
            {(!isPlaying || showControls) && (
              <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayPause}
                activeOpacity={0.7}>
                <View style={styles.playButtonCircle}>
                  <Text style={styles.playButtonIcon}>
                    {isPlaying ? '⏸' : '▶'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Camera Info */}
            <View style={styles.infoContainer}>
              {cameraStatus && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Live</Text>
                </View>
              )}
              <Text style={styles.cameraName} numberOfLines={1}>
                {cameraName}
              </Text>
              <Text style={styles.cameraLocation} numberOfLines={1}>
                {cameraLocation}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6, // Video takes about 60% of screen height
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  playButton: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonIcon: {
    fontSize: 32,
    color: '#000000',
    marginLeft: 4, // Slight offset for play icon
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  liveBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
  },
  cameraName: {
    fontSize: fonts.size.l,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.secondary,
    marginBottom: 4,
  },
  cameraLocation: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext3,
  },
});

