import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import the default avatar asset
const defaultAvatarImage = require('../assets/default-avatar.png');

interface ProfileAvatarProps {
  imageUrl?: string;
  size?: number;
  borderColor?: string;
  backgroundColor?: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  imageUrl,
  size = 40,
  borderColor = 'rgba(255, 255, 255, 0.2)',
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
}) => {
  const [imageError, setImageError] = useState(false);

  const dynamicStyles = {
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor,
      backgroundColor,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      overflow: 'hidden' as const,
    },
    image: {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
  };

  // If there's an image error, show fallback icon
  if (imageError) {
    return (
      <View style={dynamicStyles.container}>
        <Ionicons 
          name="person" 
          size={size * 0.6} 
          color="rgba(255, 255, 255, 0.7)" 
        />
      </View>
    );
  }

  // Always show Image component - either user image or default avatar
  return (
    <View style={dynamicStyles.container}>
      <Image 
        source={imageUrl ? { uri: imageUrl } : defaultAvatarImage}
        style={dynamicStyles.image}
        onError={() => setImageError(true)}
      />
    </View>
  );
};