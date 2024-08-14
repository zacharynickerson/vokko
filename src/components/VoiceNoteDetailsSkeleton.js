import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

const SkeletonItem = ({ width, height, style }) => {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeletonItem,
        { width, height },
        style,
        animatedStyle,
      ]}
    />
  );
};

const VoiceNoteDetailsSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.navigationBar}>
        <SkeletonItem width={wp(8)} height={wp(8)} style={styles.backButton} />
        <SkeletonItem width={wp(8)} height={wp(8)} />
      </View>
      
      <View style={styles.header}>
        <SkeletonItem width={wp(12)} height={wp(12)} style={styles.emoji} />
        <View style={styles.titleContainer}>
          <SkeletonItem width={wp(60)} height={hp(3)} style={styles.title} />
          <SkeletonItem width={wp(40)} height={hp(2)} style={styles.dateLocation} />
        </View>
      </View>

      <View style={styles.playbackContainer}>
        <SkeletonItem width={wp(90)} height={hp(8)} />
      </View>

      <View style={styles.tabBar}>
        <SkeletonItem width={wp(28)} height={hp(4)} />
        <SkeletonItem width={wp(28)} height={hp(4)} />
        <SkeletonItem width={wp(28)} height={hp(4)} />
      </View>

      <View style={styles.content}>
        <SkeletonItem width={wp(90)} height={hp(4)} style={styles.contentItem} />
        <SkeletonItem width={wp(80)} height={hp(4)} style={styles.contentItem} />
        <SkeletonItem width={wp(85)} height={hp(4)} style={styles.contentItem} />
        <SkeletonItem width={wp(75)} height={hp(4)} style={styles.contentItem} />
      </View>

      {/* Transparent Overlay with White Spinner */}
      <View style={styles.spinnerOverlay}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191A23',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#242830',
  },
  backButton: {
    borderRadius: wp(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: '#242830',
  },
  emoji: {
    borderRadius: wp(6),
    marginRight: wp(3),
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    marginBottom: hp(1),
  },
  dateLocation: {
    marginTop: hp(0.5),
  },
  playbackContainer: {
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: '#242830',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#242830',
  },
  content: {
    flex: 1,
    padding: wp(4),
  },
  contentItem: {
    marginBottom: hp(1.5),
  },
  skeletonItem: {
    backgroundColor: '#2A2B35',
    borderRadius: 4,
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VoiceNoteDetailsSkeleton;