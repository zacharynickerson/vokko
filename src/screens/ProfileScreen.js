import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseImage } from '../components/FirebaseImage';

      <View style={styles.avatarContainer}>
        <FirebaseImage
          source={user?.avatar || 'avatars/male/user-photo.png'}
          style={styles.avatar}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('AvatarSelection')}
        >
          <Ionicons name="pencil" size={16} color="#fff" />
        </TouchableOpacity>
      </View> 