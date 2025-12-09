import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import Header from '../../../components/common/Header';
import { GroupedContactList } from '../../../components/common/Contact';
import Footer from '../../Footer';
import { getPrivacyPolicyIntroduction, getPrivacyPolicySections } from '../../../api/support_legal';
import colors from '../../../styles/Colors';
// @ts-ignore
import fonts from '../../../styles/Fonts';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const introduction = getPrivacyPolicyIntroduction();
  const sections = getPrivacyPolicySections();

  const handleBack = () => {
    router.back();
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
      {/* Header */}
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
          value: 'Privacy policy',
        }}
      />

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
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

          {/* Sections List */}
          {sections.map((section, index) => (
            <View key={index} style={styles.sectionItem}>
              <View style={styles.sectionNumberContainer}>
                <Text style={styles.sectionNumber}>{index + 1}.</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>{section.title}:</Text>
                {section.bullets.map((bullet, bulletIndex) => (
                  <View key={bulletIndex} style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
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
    paddingTop: 20,
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
    marginBottom: 12,
  },
  logoImage: {
    width: 63,
    height: 75,
    tintColor: colors.primary,
  },
  contentSection: {
    marginTop: 20,
  },
  introduction: {
    fontSize: 14,
    fontWeight: 400,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'left',
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',

  },
  sectionNumberContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  sectionNumber: {
    fontSize: 14,
    fontWeight: 400,
    color: '#6B7280',
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 400,
    color: '#6B7280',
    marginBottom: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    marginLeft: 4,
  },
  bullet: {
    fontSize: 14,
    fontWeight: 400,
    color: '#6B7280',
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 14,
    fontWeight: 400,
    color: '#6B7280',
    lineHeight: 22,
    flex: 1,
  },
  contactSection: {
    marginTop: 30,
  },
});

