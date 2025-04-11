import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { CustomButtonProps } from '@/types';
import { verticalScale } from '@/utils/styling';
import { colors, radius } from '@/constants/theme';
import Loading from './Loading';

interface ExtendedButtonProps extends CustomButtonProps {
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

const Button = ({
  style,
  onPress,
  loading = false,
  children,
  variant = 'primary',
  icon
}: ExtendedButtonProps) => {
  const backgroundColor =
    variant === 'primary' ? colors.primary : colors.neutral800;

  const textColor =
    variant === 'primary' ? colors.neutral950 : colors.text;

  if (loading) {
    return (
      <View
        style={[
          styles.button,
          style,
          { backgroundColor: 'transparent' }
        ]}
      >
        <Loading />
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style, { backgroundColor }]}
    >
      <View style={styles.content}>
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text style={[styles.text, { color: textColor }]}>
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    borderRadius: radius._17,
    borderCurve: 'continuous',
    height: verticalScale(52),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row'
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
