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
import { getContactDetails } from '../../../api/contact';
import { getPrivacyPolicyIntroduction, getPrivacyPolicySections } from '../../../api/support_legal';
import { ContactCardProps, GroupedContactList } from '../../../components/common/Contact';
import Header from '../../../components/common/Header';
import colors from '../../../styles/Colors';
// @ts-ignore

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [contactData, setContactData] = useState<ContactCardProps[]>([]);
  const [introduction, setIntroduction] = useState<string>('');
  const [sections, setSections] = useState<Array<{ title: string; bullets: string[] }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const handleBack = () => {
    router.back();
  };

  // Load contact details from API
  const loadContactDetails = async () => {
    try {
      const contact = await getContactDetails();
      
      // Create contact data array from API response
      const contactList: ContactCardProps[] = [
        {
          icon: require('../../../assets/icons/phone.png'),
          label: 'Phone number',
          value: contact.phone,
          buttonTitle: 'Call',
          onPress: () => {},
        },
        {
          icon: require('../../../assets/icons/email.png'),
          label: 'Email',
          value: contact.email,
          buttonTitle: 'Mail',
          onPress: () => {},
        },
        {
          icon: require('../../../assets/icons/web.png'),
          label: 'Website',
          value: contact.website,
          buttonTitle: 'Visit',
          onPress: () => {},
        },
      ];
      
      setContactData(contactList);
    } catch (error) {
      console.error('Error loading contact details:', error);
      // Set empty array if API fails - only backend data should be used
      setContactData([]);
    }
  };

  // Load Privacy Policy content from API
  const loadPrivacyPolicy = async () => {
    try {
      setLoading(true);
      console.log('Loading Privacy Policy...');
      const intro = await getPrivacyPolicyIntroduction();
      const sectionsList = await getPrivacyPolicySections();
      console.log('Privacy Policy loaded:', { intro, sectionsCount: sectionsList.length });
      setIntroduction(intro);
      setSections(sectionsList);
    } catch (error: any) {
      console.error('Error loading Privacy Policy:', error);
      console.error('Error details:', error?.message);
      // Show error message to user
      setIntroduction('Error loading privacy policy. Please check if seeder has been run.');
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContactDetails();
    loadPrivacyPolicy();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload contact details and privacy policy
      await Promise.all([
        loadContactDetails(),
        loadPrivacyPolicy()
      ]);
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
            value: 'Privacy policy',
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
          {loading ? (
            <Text style={styles.introduction}>Loading...</Text>
          ) : introduction ? (
            <Text style={styles.introduction}>
              {introduction}
            </Text>
          ) : (
            <Text style={styles.introduction}>
              No content available. Please check console for errors.
            </Text>
          )}

          {/* Sections List */}
          {!loading && sections.length > 0 && sections.map((section, index) => (
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

          {!loading && sections.length === 0 && introduction && (
            <Text style={styles.introduction}>
              No sections available.
            </Text>
          )}
        </View>

        {/* Contact us Section */}
        <View style={styles.contactSection}>
          <GroupedContactList data={contactData} />
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

