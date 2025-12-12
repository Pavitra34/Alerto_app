import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAboutUsParagraphs } from '../../../api/support_legal';
import Header from '../../../components/common/Header';
import colors from '../../../styles/Colors';
// @ts-ignore
import fonts from '../../../styles/Fonts';

export default function AboutScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const handleBack = () => {
    router.back();
  };

  // Load About Us content from API
  const loadAboutUs = async () => {
    try {
      setLoading(true);
      const paragraphsList = await getAboutUsParagraphs();
      setParagraphs(paragraphsList);
    } catch (error) {
      console.error('Error loading About Us:', error);
      setParagraphs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAboutUs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload About Us content
      await loadAboutUs();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
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
          left={{
            type: 'image',
            url: require('../../../assets/icons/arrow.png'),
            width: 23,
            height: 23,
            onPress: handleBack,
          }}
          center={{
            type: 'text',
            value: 'About us',
          }}
        />
      </SafeAreaView>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* App Logo and Name */}
        <View style={styles.logoSection}>
          <View style={styles.logoIconContainer}>
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Content Text Blocks */}
        <View style={styles.contentSection}>
          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      </ScrollView>
     
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
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoIconContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: 63,
    height: 75,
    tintColor: colors.primary,
  },
  appName: {
    fontSize: fonts.size.xl,
    fontFamily: fonts.family.bold,
    fontWeight: fonts.weight.bold,
    color: colors.primary,
  },
  contentSection: {
    marginTop: 20,
  },
  paragraph: {
    fontSize: 14,
    fontWeight:400,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'left',
  },
});

