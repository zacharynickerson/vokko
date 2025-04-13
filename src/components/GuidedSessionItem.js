import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDateForDisplay } from '../utilities/helpers';

// Define a mapping of guide IDs to their avatar images
const guideAvatars = {
  '1': require('../../assets/images/Avatar Female 1.png'),
  '2': require('../../assets/images/Avatar Female 2.png'),
  '3': require('../../assets/images/Avatar Female 3.png'),
  '4': require('../../assets/images/Avatar Female 4.png'),
  '5': require('../../assets/images/Avatar Female 5.png'),
  '6': require('../../assets/images/Avatar Female 6.png'),
  // Add more mappings as needed
};

const GuidedSessionItem = ({ item, onPress }) => {
  // console.log('Guided Session Item:', item);

  // Get the guide avatar from the mapping or use default
  const guideAvatarPath = item.guideId ? 
    guideAvatars[item.guideId] || require('../../assets/images/Avatar Male 15.png') : 
    require('../../assets/images/Avatar Male 15.png');

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={item.image ? { uri: item.image } : require('../../assets/images/default-note-image.png')} 
          style={styles.image}
        />
        <View style={styles.typeIndicator}>
          <Text style={styles.typeText}>Guided</Text>
        </View>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.date}>{formatDateForDisplay(item.createdDate)}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.guideContainer}>
        <Image 
          source={guideAvatarPath}
          style={styles.guideImage}
        />
        <Text style={styles.guideName}>{item.guideName}</Text>
        <Text style={styles.moduleSeparator}> | </Text>
        <Text style={styles.moduleName}>{item.moduleName}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    borderColor: '#F9F9F9',
    borderWidth: 1,
  },
  imageContainer: {
    position: 'relative',
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 0,
  },
  image: {
    width: '100%',
    height: 125,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  typeIndicator: {
    position: 'absolute',
    top: 20, // Adjust this value to move it down
    left: 20, // Adjust this value to move it to the right
    backgroundColor: '#4FBF67', // Change to the specified color
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
  },
  typeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1B1D21',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#E0E0E0',
    // marginVertical: 5,
  },
  guideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  guideImage: {
    width: 24,
    height: 24 ,
    borderRadius: 20, // Make it circular
    marginRight: 10,
  },
  guideName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B1D21',
  },
  moduleSeparator: {
    fontSize: 14,
    color: '#666',
  },
  moduleName: {
    fontSize: 14,
    color: '#1B1D21',
  },
});

export default GuidedSessionItem;
