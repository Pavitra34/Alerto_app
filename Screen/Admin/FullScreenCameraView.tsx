import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import * as Linking from 'expo-linking';
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
import { WebView } from 'react-native-webview';
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

  // Check if the camera view is a YouTube URL
  const isYouTube = cameraView?.includes('youtube.com') || cameraView?.includes('youtu.be');

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

  // Convert YouTube URL to embed format with HTML wrapper
  const getYouTubeEmbedHtml = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;
    
    // Create HTML page with YouTube iframe embed
    // Using mobile-friendly embed URL and proper attributes
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <meta name="referrer" content="no-referrer">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              height: 100%;
              background-color: #000;
              overflow: hidden;
            }
            .video-container {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            iframe {
              width: 100%;
              height: 100%;
              border: none;
              position: absolute;
              top: 0;
              left: 0;
            }
          </style>
        </head>
        <body>
          <div class="video-container">
            <iframe
              src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent('https://www.youtube.com')}"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
              webkitallowfullscreen
              mozallowfullscreen
              scrolling="no">
            </iframe>
          </div>
        </body>
      </html>
    `;
  };

  const youtubeEmbedHtml = isYouTube && cameraView ? getYouTubeEmbedHtml(cameraView) : null;
  const [webViewError, setWebViewError] = useState(false);

  // Handle WebView error - fallback to opening in YouTube app/browser
  const handleWebViewError = () => {
    setWebViewError(true);
    if (cameraView) {
      // Try to open in YouTube app first, then fallback to browser
      const videoId = getYouTubeVideoId(cameraView);
      if (videoId) {
        // Try YouTube app URL first
        const youtubeAppUrl = `vnd.youtube:${videoId}`;
        Linking.canOpenURL(youtubeAppUrl)
          .then((supported) => {
            if (supported) {
              return Linking.openURL(youtubeAppUrl);
            } else {
              // Fallback to browser
              return Linking.openURL(cameraView);
            }
          })
          .catch(() => {
            // Final fallback
            Linking.openURL(cameraView).catch(console.error);
          });
      } else {
        Linking.openURL(cameraView).catch(console.error);
      }
      // Go back after opening
      setTimeout(() => {
        router.back();
      }, 500);
    }
  };

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

  // If YouTube, show embedded video in WebView
  if (isYouTube && youtubeEmbedHtml) {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        {/* YouTube Video WebView with HTML source */}
        {!webViewError ? (
          <WebView
            source={{ html: youtubeEmbedHtml || '' }}
            style={styles.webView}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            allowsInlineMediaPlayback={true}
            mixedContentMode="always"
            userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading video...</Text>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              handleWebViewError();
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView HTTP error: ', nativeEvent);
              if (nativeEvent.statusCode === 403 || nativeEvent.statusCode === 153) {
                handleWebViewError();
              }
            }}
            onMessage={(event) => {
              const data = event.nativeEvent.data;
              // Check if YouTube shows error message
              if (data === 'YOUTUBE_ERROR' || (data && (data.includes('Error 153') || data.includes('Video unavailable')))) {
                handleWebViewError();
              }
            }}
            injectedJavaScript={`
              (function() {
                // Monitor for YouTube error messages
                const observer = new MutationObserver(function(mutations) {
                  const bodyText = document.body.innerText || document.body.textContent || '';
                  if (bodyText.includes('Error 153') || bodyText.includes('Video unavailable') || bodyText.includes('Watch video on YouTube')) {
                    window.ReactNativeWebView.postMessage('YOUTUBE_ERROR');
                  }
                });
                observer.observe(document.body, { childList: true, subtree: true });
                
                // Check immediately
                setTimeout(function() {
                  const bodyText = document.body.innerText || document.body.textContent || '';
                  if (bodyText.includes('Error 153') || bodyText.includes('Video unavailable') || bodyText.includes('Watch video on YouTube')) {
                    window.ReactNativeWebView.postMessage('YOUTUBE_ERROR');
                  }
                }, 2000);
              })();
              true;
            `}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Opening video...</Text>
          </View>
        )}

        {/* Camera Info Overlay */}
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
    );
  }

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
  loadingText: {
    marginTop: 12,
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    color: colors.secondary,
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
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

