import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getContactDetails } from '../../../api/contact';
import { Button1 } from '../../../components/common/Button';
import { ContactCardProps, GroupedContactList } from '../../../components/common/Contact';
import Header from '../../../components/common/Header';
import InputBox from '../../../components/common/InputBox';
import colors from '../../../styles/Colors';
// @ts-ignore
import fonts from '../../../styles/Fonts';

export default function HelpCenterScreen() {
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [messageError, setMessageError] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [contactData, setContactData] = useState<ContactCardProps[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [contactEmail, setContactEmail] = useState<string>('');

  const handleBack = () => {
    router.back();
  };

  const validateFields = () => {
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      setNameError('Please fill the field');
      isValid = false;
    } else {
      setNameError('');
    }

    // Validate email
    if (!email.trim()) {
      setEmailError('Please fill the field');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Validate message
    if (!message.trim()) {
      setMessageError('Please fill the field');
      isValid = false;
    } else {
      setMessageError('');
    }

    return isValid;
  };

  const handleSubmit = () => {
    // Always validate when submit is clicked
    const isValid = validateFields();
    if (isValid) {
      console.log('Submit pressed', { name, email, message });
      
      // Get contact email from contactData
      const emailContact = contactData.find(item => item.label === 'Email');
      const toEmail = emailContact?.value || contactEmail || '';
      
      if (!toEmail) {
        console.error('Contact email not found');
        return;
      }
      
      // Create mailto URL with user's email in the body
      const subject = encodeURIComponent(`Help Center Inquiry from ${name}`);
      const body = encodeURIComponent(
        `From: ${email}\n\n${message}`
      );
      const mailtoUrl = `mailto:${toEmail}?subject=${subject}&body=${body}`;
      
      // Open email client
      Linking.openURL(mailtoUrl).catch((err) => {
        console.error('Error opening email client:', err);
      });
      
      // Clear all fields after opening email client
      setName('');
      setEmail('');
      setMessage('');
      setNameError('');
      setEmailError('');
      setMessageError('');
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError) {
      setNameError('');
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      setEmailError('');
    }
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);
    if (messageError) {
      setMessageError('');
    }
  };

  const isFormValid = name.trim() !== '' && email.trim() !== '' && message.trim() !== '';

  // Load contact details from API
  const loadContactDetails = async () => {
    try {
      setLoading(true);
      const contact = await getContactDetails();
      
      // Store contact email for email functionality
      setContactEmail(contact.email);
      
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContactDetails();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload contact details
      await loadContactDetails();
      // Clear form fields on refresh
      setName('');
      setEmail('');
      setMessage('');
      setNameError('');
      setEmailError('');
      setMessageError('');
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
            value: 'Help center',
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

        {/* Let's talk Section */}
        <View style={styles.talkSection}>
          <Text style={styles.sectionTitle}>Let's talk</Text>
          
          <InputBox
            label="Name"
            placeholder="Enter your name"
            value={name}
            setValue={handleNameChange}
            containerStyle={styles.inputContainer52}
            errorMessage={nameError}
          />

          <InputBox
            label="Email"
            placeholder="Enter your email address"
            value={email}
            setValue={handleEmailChange}
            keyboardType="email-address"
            containerStyle={styles.inputContainer52}
            errorMessage={emailError}
          />

          <InputBox
            label="How can we help you?"
            placeholder="Type here..."
            value={message}
            setValue={handleMessageChange}
            multiline={true}
            containerStyle={styles.messageInputContainer}
            errorMessage={messageError}
          />

          <Button1
            text="Send"
            width="100%"
            onPress={handleSubmit}
            backgroundColor={colors.primary}
            height={39}
            containerStyle={styles.submitButton}
            textStyle={styles.submitButtonText}
          />
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
    paddingBottom: 50,
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

  talkSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: fonts.size.l,
    fontFamily: fonts.family.bold,
    fontWeight: fonts.weight.bold,
    color: colors.text,
    marginBottom: 12,
    
  },
  inputContainer52: {
    minHeight: 52,
    paddingVertical: 4,


  },
  messageInputContainer: {
    minHeight: 123,
    
  },
  submitButton: {
    borderRadius: 12,
    marginTop:20
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.secondary,
    fontSize: fonts.size.m,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
  },
  submitButtonTextDisabled: {
    color: colors.button_text,
  },
  contactSection: {
  },
});

