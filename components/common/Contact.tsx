import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { Button1 } from './Button';

import CartBox from './CartBox';
import colors from '@/styles/Colors';
import fonts from '@/styles/Fonts';

export interface ContactCardProps {
  icon: ImageSourcePropType;
  label: string;
  value: string;
  buttonTitle: string;
  onPress: () => void;
  lang?: any;
}

export const contactList: ContactCardProps[] = [
  {
    icon: require('../../assets/icons/phone.png'),
    label: 'Phone number',
    value: '',
    buttonTitle: 'Call',
    onPress: () => {},
  },
  {
    icon: require('../../assets/icons/email.png'),
    label: 'Email',
    value: '',
    buttonTitle: 'Mail',
    onPress: () => {},
  },
  {
    icon: require('../../assets/icons/web.png'),
    label: 'Website',
    value: '',
    buttonTitle: 'Visit',
    onPress: () => {},
  },
];

const ContactCard = ({
  icon,
  label,
  value,
  buttonTitle,
  onPress,
}: ContactCardProps) => {
  return (
    <CartBox
      borderRadius={12}
      backgroundColor="#F1F2F4"
      paddingVertical={10}
      paddingHorizontal={12}
      marginBottom={20}
      height={58}
    >
      <View style={styles.cardContent}>
        <View style={styles.leftSection}>
          <Image source={icon} style={styles.iconImage} />
          <View style={styles.textBlock}>
            <Text style={styles.label}>{label}</Text>
            <Text
              style={styles.value}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {value}
            </Text>
          </View>
        </View>
        <Button1
          text={buttonTitle}
          backgroundColor={colors.primary}
          containerStyle={{
            borderRadius: 20,
            width: 50,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 0,
          }}
          textStyle={{
            color: colors.secondary,
            fontSize: 12,
            textAlign: 'center',
            paddingVertical: 4,
          }}
          onPress={onPress}
        />
      </View>
    </CartBox>
  );
};

export const GroupedContactList = ({
  data,
  lang,
}: {
  data?: ContactCardProps[];
  lang?: any;
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // if data not passed, use default contactList
  const templateItems = data ?? contactList;

  // Build items with proper click handlers
  const itemsToRender: ContactCardProps[] = React.useMemo(() => {
    return templateItems.map(it => {
      const newItem = { ...it };

      // Set up click handlers based on contact type
      if (/phone/i.test(newItem.label) && newItem.value) {
        newItem.onPress = () => {
          if (newItem.value && newItem.value !== 'undefined') {
            Linking.openURL(`tel:${newItem.value}`);
          }
        };
      } else if (/email/i.test(newItem.label) && newItem.value) {
        newItem.onPress = () => {
          if (newItem.value && newItem.value !== 'undefined') {
            Linking.openURL(`mailto:${newItem.value}`);
          }
        };
      } else if (/website/i.test(newItem.label) && newItem.value) {
        newItem.onPress = () => {
          if (newItem.value && newItem.value !== 'undefined') {
            let url = newItem.value;
            // Add https:// if not present
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              url = `https://${url}`;
            }
            Linking.openURL(url);
          }
        };
      }

      // Translate labels
      if (lang) {
        if (/phone/i.test(newItem.label)) {
          newItem.label = lang.phoneNumber ?? 'Phone number';
          newItem.buttonTitle = lang.call ?? 'Call';
        }
        if (/email/i.test(newItem.label)) {
          newItem.label = lang.email ?? 'Email';
          newItem.buttonTitle = lang.mail ?? 'Mail';
        }
        if (/website/i.test(newItem.label)) {
          newItem.label = lang.website ?? 'Website';
          newItem.buttonTitle = lang.visit ?? 'Visit';
        }
      }
      return newItem;
    });
  }, [templateItems, lang]);

  return (
    <View
      style={[
        styles.groupCardWrapper,
        {
          width: isTablet ? width * 0.9 : width * 0.95,
        },
      ]}
    >
      <Text style={styles.groupHeader}>{lang?.Contact_us ?? 'Contact Us'}</Text>

      {itemsToRender.map((item, index) => (
        <ContactCard key={index} {...item} />
      ))}
    </View>
  );
};


const styles = StyleSheet.create({
  groupCardWrapper: {
    borderRadius: 16,
    padding: 16,
    alignSelf: 'center',
    marginTop: -20,
  },
  groupHeader: {
    fontSize: fonts.size.l,
    fontWeight: fonts.weight.bold as any,
    marginBottom: 12,
    color: colors.text,
    width: '100%'
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '95%',
  
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconImage: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    marginRight: 12,
    marginTop: 2,
  },
  textBlock: {
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    color: colors.text,
    fontWeight: fonts.weight.regular,
    
  },
  value: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 2,
    maxWidth: 180,
  },
});

export default ContactCard;