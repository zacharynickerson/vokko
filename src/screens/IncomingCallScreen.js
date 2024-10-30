import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, PanResponder, Vibration, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Audio } from 'expo-av';

const IncomingCallScreen = ({ route, navigation }) => {
  const { sessionData } = route.params;
  const pan = useRef(new Animated.ValueXY()).current;
  const soundRef = useRef(null);

  useEffect(() => {
    // startRinging();
    startVibrating();

    return () => {
      // stopRinging();
      stopVibrating();
    };
  }, []);

  // const startRinging = async () => {
  //   try {
  //     const { sound } = await Audio.Sound.createAsync(
  //       require('../../assets/sounds/incoming-call.mp3'),
  //       { shouldPlay: true, isLooping: true }
  //     );
  //     soundRef.current = sound;
  //   } catch (error) {
  //     console.error('Error playing sound:', error);
  //   }
  // };

  // const stopRinging = async () => {
  //   if (soundRef.current) {
  //     await soundRef.current.stopAsync();
  //     await soundRef.current.unloadAsync();
  //   }
  // };

  const startVibrating = () => {
    // Vibration pattern: wait 1s, vibrate 1s, wait 1s, repeat
    const pattern = [1000, 1000, 1000];
    Vibration.vibrate(pattern, true);
  };

  const stopVibrating = () => {
    Vibration.cancel();
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      // Only allow upward movement
      if (gesture.dy < 0) {
        pan.setValue({ x: 0, y: Math.max(gesture.dy, -200) });
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy < -100) { // Threshold for accepting call
        handleAcceptCall();
      } else {
        // Reset position if not accepted
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const handleAcceptCall = async () => {
    // await stopRinging();
    stopVibrating();
    
    navigation.replace('GuidedSessionCall', {
      guide: {
        id: sessionData.guideId,
        name: sessionData.guideName,
        mainPhoto: sessionData.guidePhoto,
      },
      module: {
        id: sessionData.moduleId,
        name: sessionData.moduleName,
      },
    });
  };

  const handleDeclineCall = async () => {
    // await stopRinging();
    stopVibrating();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.callerInfo}>
        <Image 
          source={{ uri: sessionData.guidePhoto }}
          style={styles.callerImage}
        />
        <Text style={styles.callerName}>{sessionData.guideName}</Text>
        <Text style={styles.callType}>{sessionData.moduleName} Session</Text>
      </View>

      <View style={styles.actionsContainer}>
        <Animated.View
          style={[styles.swipeButton, pan.getLayout()]}
          {...panResponder.panHandlers}
        >
          <MaterialCommunityIcons name="phone" size={30} color="white" />
          <Text style={styles.swipeText}>Swipe up to answer</Text>
        </Animated.View>

        <TouchableOpacity 
          style={styles.declineButton}
          onPress={handleDeclineCall}
        >
          <MaterialCommunityIcons name="phone-hangup" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1D21',
    justifyContent: 'space-between',
    padding: wp(5),
  },
  callerInfo: {
    alignItems: 'center',
    marginTop: hp(10),
  },
  callerImage: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    marginBottom: hp(3),
  },
  callerName: {
    fontSize: wp(6),
    color: 'white',
    fontWeight: 'bold',
    marginBottom: hp(1),
  },
  callType: {
    fontSize: wp(4),
    color: '#FFFFFF80',
  },
  actionsContainer: {
    alignItems: 'center',
    marginBottom: hp(5),
  },
  swipeButton: {
    backgroundColor: '#4CAF50',
    width: wp(70),
    height: hp(8),
    borderRadius: hp(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(3),
  },
  swipeText: {
    color: 'white',
    marginLeft: wp(3),
    fontSize: wp(4),
  },
  declineButton: {
    backgroundColor: '#FF3B30',
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IncomingCallScreen;