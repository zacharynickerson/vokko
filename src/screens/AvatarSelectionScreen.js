import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FirebaseImage } from '../components/FirebaseImage';
import { userService } from '../services/userService';

export default function AvatarSelectionScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const theme = useTheme();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar);
  const [gender, setGender] = useState('male');

  const maleAvatars = Array.from({ length: 15 }, (_, i) => ({
    id: `male-${i + 1}`,
    source: `avatars/male/Avatar Male ${i + 1}.png`,
  }));

  const femaleAvatars = Array.from({ length: 15 }, (_, i) => ({
    id: `female-${i + 1}`,
    source: `avatars/female/Avatar Female ${i + 1}.png`,
  }));

  const handleAvatarSelect = async (avatarSource) => {
    try {
      setSelectedAvatar(avatarSource);
      await userService.updateUserAvatar(user.uid, avatarSource);
      updateUser({ ...user, avatar: avatarSource });
      navigation.goBack();
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update avatar. Please try again.');
    }
  };

  const renderAvatar = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.avatarItem,
        selectedAvatar === item.source && styles.selectedAvatar,
      ]}
      onPress={() => handleAvatarSelect(item.source)}
    >
      <FirebaseImage
        source={item.source}
        style={styles.avatar}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.genderSelector}>
        <TouchableOpacity
          style={[
            styles.genderButton,
            gender === 'male' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setGender('male')}
        >
          <Text style={[styles.genderText, gender === 'male' && styles.selectedGenderText]}>
            Male
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.genderButton,
            gender === 'female' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setGender('female')}
        >
          <Text style={[styles.genderText, gender === 'female' && styles.selectedGenderText]}>
            Female
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={gender === 'male' ? maleAvatars : femaleAvatars}
        renderItem={renderAvatar}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.avatarGrid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  genderSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  genderButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedGenderText: {
    color: '#fff',
  },
  avatarGrid: {
    paddingBottom: 20,
  },
  avatarItem: {
    width: (Dimensions.get('window').width - 48) / 3,
    height: (Dimensions.get('window').width - 48) / 3,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedAvatar: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
}); 