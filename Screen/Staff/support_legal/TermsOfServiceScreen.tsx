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
import { getTermsOfServiceIntroduction, getTermsOfServiceTerms } from '../../../api/support_legal';
import { ContactCardProps, GroupedContactList } from '../../../components/common/Contact';
import Header from '../../../components/common/Header';
import colors from '../../../styles/Colors';
// @ts-ignore
import fonts from '../../../styles/Fonts';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [contactData, setContactData] = useState<ContactCardProps[]>([]);
  const [introduction, setIntroduction] = useState<string>('');
  const [terms, setTerms] = useState<Array<{ title: string; description: string }>>([]);
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

  // Load Terms of Service content from API
  const loadTermsOfService = async () => {
    try {
      setLoading(true);
      console.log('Loading Terms of Service...');
      const intro = await getTermsOfServiceIntroduction();
      const termsList = await getTermsOfServiceTerms();
      console.log('Terms of Service loaded:', { intro, termsCount: termsList.length });
      setIntroduction(intro);
      setTerms(termsList);
    } catch (error: any) {
      console.error('Error loading Terms of Service:', error);
      console.error('Error details:', error?.message);
      // Show error message to user
      setIntroduction('Error loading terms of service. Please check if seeder has been run.');
      setTerms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContactDetails();
    loadTermsOfService();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload contact details and terms
      await Promise.all([
        loadContactDetails(),
        loadTermsOfService()
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
          {loading ? (
            <Text style={styles.introduction}>Loading...</Text>
          ) : introduction ? (
            <Text style={styles.introduction}>
              {introduction}
            </Text>
          ) : (
            <Text style={styles.introduction}>
              No content available. Please run the seeder script.
            </Text>
          )}

          {/* Terms List */}
          {!loading && terms.length > 0 && terms.map((term, index) => (
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

          {!loading && terms.length === 0 && introduction && (
            <Text style={styles.introduction}>
              No terms available.
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

