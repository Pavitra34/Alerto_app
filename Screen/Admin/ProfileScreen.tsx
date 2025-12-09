import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Header from '../../components/common/Header';
import Footer_A from '../Footer_A';
import colors from '../../styles/Colors';
// @ts-ignore
import fonts from '../../styles/Fonts';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header
        center={{
          type: 'text',
          value: 'Profile',
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Profile</Text>
          <Text style={styles.sectionText}>
            This is the Profile Screen for admin users. Manage your profile settings here.
          </Text>
        </View>
      </ScrollView>
      <Footer_A />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: fonts.size.xl,
    fontFamily: fonts.family.medium,
    fontWeight: fonts.weight.medium,
    color: colors.text,
    marginBottom: 10,
  },
  sectionText: {
    fontSize: fonts.size.m,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.subtext,
    lineHeight: 22,
  },
});

