import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path } from 'react-native-svg';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const CallLayout = ({ 
  isGuidedSession, 
  guideName, 
  userFirstName, 
  userLastName, 
  moduleName, 
  guidePhoto, 
  userProfilePhoto,
  sessionTime,
  gradientColor,
  location
}) => {
  const name = isGuidedSession ? guideName : `${userFirstName} ${userLastName}`;
  const sessionType = isGuidedSession ? moduleName : "Solo Session";
  const photo = isGuidedSession ? guidePhoto : userProfilePhoto;

  // Memoize map URL generation
  const mapUrl = useMemo(() => {
    if (!location) return null;
    return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${location.longitude},${location.latitude},14/400x200?access_token=${process.env.MAPBOX_TOKEN}`;
  }, [location?.latitude, location?.longitude]);

  const Star = () => (
    <Svg width={wp(8)} height={wp(8)} viewBox="0 0 24 24" fill="white">
      <Path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" />
    </Svg>
  );

  const BackgroundLines = () => (
    <Svg
      width="200%"
      height="200%"
      viewBox="0 0 800 800"
      style={[
        StyleSheet.absoluteFill,
        styles.backgroundLines,
        { top: '-20%', left: '-60%' }
      ]}
    >
      <Path
        d="M0 50 Q100 0, 200 50 T400 50 T600 50 T800 50"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2"
      />
      <Path
        d="M0 150 Q100 100, 200 150 T400 150 T600 150 T800 150"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2"
      />
    </Svg>
  );

  return (
    <View style={styles.container}>
      {isGuidedSession ? (
        <LinearGradient
          colors={[gradientColor, '#1B1D21']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1B1D21' }]} />
      )}
      
      <BackgroundLines />

      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.sessionType}>{sessionType}</Text>

        <View style={styles.photoContainer}>
          {React.isValidElement(photo) ? (
            photo
          ) : (
            <Image 
              source={typeof photo === 'string' ? { uri: photo } : photo} 
              style={styles.photo}
              defaultSource={require('../../assets/images/default-prof-pic.png')}
            />
          )}
          <View style={[styles.star, styles.starLeft]}><Star /></View>
          <View style={[styles.star, styles.starRight]}><Star /></View>
        </View>

        <Text style={styles.timer}>{sessionTime} / 10:00</Text>
      </View>

      {location && mapUrl && (
        <View style={styles.mapContainer}>
          <Image
            source={{ uri: mapUrl }}
            style={styles.mapImage}
            resizeMode="cover"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: '40%',
    alignItems: 'center',
  },
  name: {
    fontSize: wp(4.5),
    color: 'white',
    marginBottom: hp(2),
  },
  sessionType: {
    fontSize: wp(7),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: hp(3),
  },
  photoContainer: {
    position: 'relative',
    marginBottom: hp(3),
  },
  photo: {
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
  },
  star: {
    position: 'absolute',
  },
  starLeft: {
    top: '50%',
    left: '50%',
    marginTop: hp(2),
    marginLeft: wp(5.5),
  },
  starRight: {
    top: '50%',
    right: '50%',
    marginTop: -hp(5.5),
    marginRight: wp(5.5),
  },
  timer: {
    fontSize: wp(2.5),
    color: 'white',
    marginTop: hp(2),
  },
  backgroundLines: {
    transform: [{ rotate: '30deg' }],
    position: 'absolute',
  },
  mapContainer: {
    marginTop: hp(4),
    height: hp(25),
    width: '100%',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
});

export default CallLayout;
