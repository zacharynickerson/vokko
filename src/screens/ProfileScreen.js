import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseImage } from '../components/FirebaseImage';

      <View style={styles.avatarContainer}>
        <FirebaseImage
          avatarName={user?.avatar}
          style={styles.avatar}
          defaultImage={require('/Users/zachary.nickerson/Desktop/vokko/assets/images/default-prof-pic.png')}
        />
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('AvatarSelection')}
        >
          <Ionicons name="pencil" size={16} color="#fff" />
        </TouchableOpacity>
      </View>