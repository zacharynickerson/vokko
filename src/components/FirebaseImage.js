import React from 'react';
import { Image } from 'react-native';
import imageUrls from '../../config/image-urls.json';
import { auth } from '../../config/firebase';

const FirebaseImage = ({ 
  avatarName,
  uiName, 
  gender = null,
  style, 
  defaultImage = require('../../assets/images/default-prof-pic.png')
}) => {
  let imageUrl = null;

  // First check if we have a photoURL from the user's auth profile
  if (auth.currentUser?.photoURL) {
    imageUrl = auth.currentUser.photoURL;
  } else if (avatarName) {
    if (gender) {
      // If gender is specified, look in the gender-specific folder
      imageUrl = imageUrls.avatars[gender.toLowerCase()]?.[avatarName];
    } else {
      // If no gender specified, look in both folders
      imageUrl = imageUrls.avatars.male[avatarName] || imageUrls.avatars.female[avatarName];
    }
  } else if (uiName) {
    // Look for UI images
    imageUrl = imageUrls.ui[uiName];
  }

  return (
    <Image
      source={imageUrl ? { uri: imageUrl } : defaultImage}
      style={style}
    />
  );
};

export default FirebaseImage; 