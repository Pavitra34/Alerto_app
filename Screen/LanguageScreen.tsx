import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Button1 } from '../components/common/Button';

const LanguageScreen = () => {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('deutsch');

  const languages = [
    {
      id: 'deutsch',
      name: 'Deutsch',
      subtitle: 'German',
      flagImage: require('../assets/icons/german.png'),
    },
    {
      id: 'english',
      name: 'English',
      subtitle: 'English (UK)',
      flagImage: require('../assets/icons/english.png'),
    },
  ];

  const handleSelect = async () => {
    try {
      // Get the selected language name
      const selectedLangName = languages.find(lang => lang.id === selectedLanguage)?.name || selectedLanguage;
      
      // Console log the selected language name
      console.log('Selected Language:', selectedLangName);
      
      // Save selected language to AsyncStorage
      // Map 'deutsch' to 'de' and 'english' to 'en' for consistency
      const langId = selectedLanguage === 'deutsch' ? 'de' : 'en';
      await AsyncStorage.setItem('langId', langId);
      
      // Navigate to LoginScreen
      router.push('/login' as any);
    } catch (error) {
      console.error('Error saving language:', error);
      // Still navigate even if saving fails
      router.push('/login' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        {/* Logo and App Name */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Language Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../assets/images/language.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Language Selection Section */}
        <View style={styles.selectionContainer}>
          <Text style={styles.sectionTitle}>Language</Text>
          <Text style={styles.sectionSubtitle}>
            Choose how you'd like to view the app
          </Text>

          {languages.map((language) => (
            <TouchableOpacity
              key={language.id}
              style={[
                styles.languageOption,
                selectedLanguage === language.id && styles.languageOptionSelected,
              ]}
              onPress={() => setSelectedLanguage(language.id)}>
              <Image
                source={language.flagImage}
                style={styles.flagImage}
                resizeMode="contain"
              />
              <View style={styles.languageTextContainer}>
                <Text
                  style={[
                    styles.languageName,
                    selectedLanguage === language.id && styles.languageNameSelected,
                  ]}>
                  {language.name}
                </Text>
                <Text
                  style={[
                    styles.languageSubtitle,
                    selectedLanguage === language.id && styles.languageSubtitleSelected,
                  ]}>
                  {language.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Select Button */}
        <View style={styles.buttonContainer}>
          <Button1
            text="Select"
            onPress={handleSelect}
            backgroundColor="#4A90F2"
            width={350}
            height={43}
            containerStyle={styles.selectButton}
            textStyle={styles.selectButtonText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LanguageScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 78,
    marginBottom: 30,

  },
  logo: {
    width: 63,
    height: 75,
    marginBottom: 12,
   
  },
  illustrationContainer: {
    alignItems: 'center',
    height: 229,

  },
  illustration: {
    width: '100%',
    height: '100%',
    maxWidth: 350,
    marginBottom: 30,
  },
  selectionContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 500,
    color: '#111',
    marginBottom: 8,
    alignSelf: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 19,
    alignSelf: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    paddingTop: 10,
    paddingRight: 20,
    paddingBottom: 10,
    paddingLeft: 20,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginBottom: 12,
    alignSelf: 'center',
    
  },
  languageOptionSelected: {
    borderColor: '#90CAF9',

  },
  flagImage: {
    width: 17,
    height: 17,
    marginRight: 16,
  },
  languageTextContainer: {
    flex: 1,
    right : 10,
   
  },
  languageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  languageNameSelected: {

  },
  languageSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  languageSubtitleSelected: {
      
  },
  buttonContainer: {
    marginTop: 'auto',
    alignItems: 'center',
    marginBottom: 60,
  },
  selectButton: {
    marginTop: 0,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

