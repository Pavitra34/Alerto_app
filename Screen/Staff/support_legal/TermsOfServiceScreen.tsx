import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../../components/common/Header';
import { GroupedContactList } from '../../../components/common/Contact';
import Footer from '../../Footer';
import { getTermsOfServiceIntroduction, getTermsOfServiceTerms } from '../../../api/support_legal';
import colors from '../../../styles/Colors';
// @ts-ignore
import fonts from '../../../styles/Fonts';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const introduction = getTermsOfServiceIntroduction();
  const terms = getTermsOfServiceTerms();

  const handleBack = () => {
    router.back();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload content - data is already loaded from function
      // This is mainly for UI refresh
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Contact data
  const contactData = [
    {
      icon: require('../../../assets/icons/phone.png'),
      label: 'Phone number',
      value: '07755112445',
      buttonTitle: 'Call',
      onPress: () => {},
    },
    {
      icon: require('../../../assets/icons/email.png'),
      label: 'Email',
      value: 'example@gmail.com',
      buttonTitle: 'Mail',
      onPress: () => {},
    },
    {
      icon: require('../../../assets/icons/web.png'),
      label: 'Website',
      value: 'example.com',
      buttonTitle: 'Visit',
      onPress: () => {},
    },
  ];

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
            value: 'Terms of service',
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

        {/* Introduction */}
        <View style={styles.contentSection}>
          <Text style={styles.introduction}>
            {introduction}
          </Text>

          {/* Terms List */}
       
            {terms.map((term, index) => (
              <View key={index} style={styles.termItem}>
                <View style={styles.termNumberContainer}>
                  <Text style={styles.termNumber}>{index + 1}.</Text>
                </View>
                <View style={styles.termContent}>
                  <Text style={styles.termTitle}>{term.title}:</Text>
                  <Text style={styles.termDescription}>{term.description}</Text>
                </View>
              </View>
            ))}
          </View>
   

        {/* Contact us Section */}
        <View style={styles.contactSection}>
          <GroupedContactList data={contactData} />
        </View>
      </ScrollView>
      <Footer />
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
    marginBottom: 20,
  },
  logoIconContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
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
  introduction: {
    fontSize: 14,
    fontWeight: 400,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'left',
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  
  },
  termNumberContainer: {
    marginRight: 12,
    marginTop: 2,
 
  },
  termNumber: {
    fontSize: 14,
    fontWeight: 400,
    color: "#6B7280",
  },
  termContent: {
    flex: 1,
  },
  termTitle: {
    fontSize: 14,
    fontWeight: 400,
    color: "#6B7280",
  },
  termDescription: {
    fontSize: 14,
    fontWeight: 400,
    color: "#6B7280",
    lineHeight: 22,
  },
  contactSection: {
    marginTop: 30,
  },
});

