import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import MapTest from '../components/MapTest';

const MapTestScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <MapTest />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default MapTestScreen; 