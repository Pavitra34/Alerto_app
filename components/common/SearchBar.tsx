import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import colors from '../../styles/Colors';
// @ts-ignore
import fonts from '../../styles/Fonts';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
}

export default function SearchBar({
  placeholder = 'Search by name',
  value,
  onChangeText,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Image
          source={require('../../assets/icons/search.png')} // Search icon
          style={styles.searchIcon}
          resizeMode="contain"
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#BFBFBF"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    height: 40,
  },
  searchIcon: {
    width: 16,
    height: 16,
    marginRight: 10,
    tintColor: colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.regular,
    color: colors.text,
    padding: 0,
  },
});

