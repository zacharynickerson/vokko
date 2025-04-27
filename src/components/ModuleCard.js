import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons';
import LinearGradient from 'react-native-linear-gradient';
import FirebaseImage from './FirebaseImage';

const ModuleCard = ({ guideName, guidePhoto, moduleName, moduleDescription, backgroundColor, size = 'normal' }) => {
  const cardStyle = size === 'small' ? styles.smallCard : styles.normalCard;
  const textStyle = size === 'small' ? styles.smallText : styles.normalText;
  
  return (
    <TouchableOpacity style={[cardStyle, { backgroundColor }]}>
      <View style={styles.backgroundContainer}>
        <View style={[styles.backgroundChevron, { backgroundColor: backgroundColor + '80' }]} />
      </View>
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        style={styles.gradient}
      />
      <View style={styles.foregroundContainer}>
        <FirebaseImage 
          avatarName={guidePhoto}
          style={styles.guidePhoto} 
        />
        <View style={styles.contentContainer}>
          <View style={styles.guidePill}>
            <Ionicons name="flash" size={textStyle.guideNameIcon.fontSize} color="#FFFFFF" />
            <Text style={[styles.guideName, textStyle.guideName]}>{guideName}</Text>
          </View>
          <View style={styles.moduleInfo}>
            <Text style={[styles.moduleName, textStyle.moduleName]}>{moduleName}</Text>
            <Text style={[styles.moduleDescription, textStyle.moduleDescription]}>{moduleDescription}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  normalCard: {
    borderRadius: wp(4),
    marginBottom: hp(2),
    marginRight: hp(2),
    width: wp(92),
    overflow: 'hidden',
    height: hp(24),
    position: 'relative',
    backgroundColor: '#C52528',
  },
  smallCard: {
    borderRadius: wp(3),
    marginBottom: hp(1.5),
    marginRight: hp(1.5),
    width: wp(69), // 75% of the normal width
    height: hp(18), // 75% of the normal height
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#C52528',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundChevron: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '70%',
    height: '100%',
    transform: [{ skewX: '-20deg' }],
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  foregroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  guidePhoto: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '60%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: wp(4),
    height: '100%',
    justifyContent: 'space-between',
    zIndex: 2,
    flex: 1,
  },
  guidePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: wp(1),
    paddingHorizontal: wp(2),
    borderRadius: wp(4),
    alignSelf: 'flex-start',
  },
  guideName: {
    fontFamily: 'DMSans-Bold',
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: wp(1),
  },
  moduleInfo: {
    marginTop: 'auto',
    width: '70%',
  },
  moduleName: {
    fontFamily: 'DMSans-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: wp(1),
  },
  moduleDescription: {
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    fontWeight: '500',

  },
  normalText: {
    guideName: {
      fontSize: wp(3.5),
    },
    guideNameIcon: {
      fontSize: wp(3.5),
    },
    moduleName: {
      fontSize: wp(7),
    },
    moduleDescription: {
      fontSize: wp(4),
    },
  },
  smallText: {
    guideName: {
      fontSize: wp(2.625), // 75% of normal size
    },
    guideNameIcon: {
      fontSize: wp(2.625), // 75% of normal size
    },
    moduleName: {
      fontSize: wp(5.25), // 75% of normal size
    },
    moduleDescription: {
      fontSize: wp(3), // 75% of normal size
    },
  },
});

export default ModuleCard;
