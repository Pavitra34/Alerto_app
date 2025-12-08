import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import Header from '../../components/common/Header';
import Footer from '../Footer';
import colors from '../../styles/Colors';

export default function HistoryScreen() {
  const params = useLocalSearchParams();
  const [langId, setLangId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Get params or load from AsyncStorage
    const loadData = async () => {
      try {
        const storedLangId = params.langId as string || await AsyncStorage.getItem('langId') || 'en';
        const storedUserId = params.userId as string || await AsyncStorage.getItem('userId') || '';
        
        setLangId(storedLangId);
        setUserId(storedUserId);
        
        console.log('History Screen - langId:', storedLangId, 'userId:', storedUserId);
      } catch (error) {
        console.error('Error loading history data:', error);
      }
    };

    loadData();
  }, [params]);

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // Add notification navigation logic here
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        center={{
          type: 'text',
          value: 'History',
        }}

      />
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
});

