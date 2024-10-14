import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { formatDateForDisplay } from '../utilities/helpers';

const GuidedSessionItem = ({ item }) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image 
          source={item.image ? { uri: item.image } : require('/Users/zacharynickerson/Desktop/vokko/assets/images/default-note-image.png')} 
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
          source={item.guideImage ? { uri: item.guideImage } : require('/Users/zacharynickerson/Desktop/vokko/assets/images/Avatar Male 15.png')} 
          style={styles.guideImage}
        />
        <Text style={styles.guideName}>{item.guideName}</Text>
        <Text style={styles.moduleSeparator}> | </Text>
        <Text style={styles.moduleName}>{item.moduleName}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
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
