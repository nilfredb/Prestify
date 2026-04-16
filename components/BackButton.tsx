import { StyleSheet, TouchableOpacity, View, Animated, Platform } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { BackButtonProps } from '@/types';
import { CaretLeft } from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import { colors, radius, spacingX } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BackButton = ({
  style,
  iconSize = 26,
  onPress,
  iconColor = colors.white,
  backgroundColor = colors.neutral800
}: BackButtonProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Fade in animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  const handlePress = () => {
    // Scale down animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    // Execute custom onPress handler or default router.back
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };
  
  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      <TouchableOpacity 
        onPress={handlePress} 
        style={[
          styles.button, 
          { backgroundColor: backgroundColor },
          style
        ]}
        activeOpacity={0.7}
      >
        <CaretLeft
          color={iconColor}
          size={verticalScale(iconSize)}
          weight="bold"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    borderRadius: radius._12,
    borderCurve: 'continuous',
    paddingHorizontal: spacingX._7,
    paddingVertical: 8,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 3.5,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});