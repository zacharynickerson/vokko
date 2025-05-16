import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons';
import { requestPermissions, checkPermissions } from '../../../utils/permissions';

const { width } = Dimensions.get('window');

const PermissionsSlide = ({ onNext }) => {
  const [permissions, setPermissions] = useState({
    audio: false,
    location: false,
    notifications: false,
  });

  useEffect(() => {
    checkCurrentPermissions();
  }, []);

  const checkCurrentPermissions = async () => {
    const currentPermissions = await checkPermissions();
    setPermissions(currentPermissions);
  };

  const handleRequestPermissions = async () => {
    const newPermissions = await requestPermissions();
    setPermissions(newPermissions);
    
    // If all permissions are granted, proceed to next slide
    if (newPermissions.audio && newPermissions.location && newPermissions.notifications) {
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enable Permissions</Text>
        <Text style={styles.subtitle}>
          Rambull needs a few permissions to work properly
        </Text>

        <View style={styles.permissionItem}>
          <Ionicons
            name={permissions.audio ? 'checkmark-circle' : 'mic'}
            size={24}
            color={permissions.audio ? '#4FBF67' : '#666'}
          />
          <Text style={styles.permissionText}>Microphone Access</Text>
        </View>

        <View style={styles.permissionItem}>
          <Ionicons
            name={permissions.location ? 'checkmark-circle' : 'location'}
            size={24}
            color={permissions.location ? '#4FBF67' : '#666'}
          />
          <Text style={styles.permissionText}>Location Access</Text>
        </View>

        <View style={styles.permissionItem}>
          <Ionicons
            name={permissions.notifications ? 'checkmark-circle' : 'notifications'}
            size={24}
            color={permissions.notifications ? '#4FBF67' : '#666'}
          />
          <Text style={styles.permissionText}>Notifications</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.enableButton}
        onPress={handleRequestPermissions}
      >
        <Text style={styles.enableButtonText}>Enable Permissions</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width,
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: wp(7),
    fontWeight: 'bold',
    color: '#1B1D21',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  subtitle: {
    fontSize: wp(4),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp(4),
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: hp(2),
  },
  permissionText: {
    fontSize: wp(4),
    color: '#1B1D21',
    marginLeft: 15,
  },
  enableButton: {
    backgroundColor: '#4FBF67',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: hp(2),
    marginTop: 0,
  },
  enableButtonText: {
    color: 'white',
    fontSize: wp(4.5),
    fontWeight: 'bold',
  },
});

export default PermissionsSlide; 