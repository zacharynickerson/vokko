import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const DebugInfo = ({ room, isMicEnabled, audioTrack }) => {
  if (!__DEV__) return null;  // Only show in development

  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugText}>
        Room Connected: {room ? '✅' : '❌'}{'\n'}
        Mic Enabled: {isMicEnabled ? '✅' : '❌'}{'\n'}
        Audio Track: {audioTrack ? '✅' : '❌'}{'\n'}
      </Text>
    </View>
  );
};

// Add to your styles
const styles = StyleSheet.create({
  debugContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
  },
}); 