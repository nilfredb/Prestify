import { StyleSheet, View, Platform } from 'react-native';
import React from 'react';
import { HeaderProps } from '@/types';
import Typo from './Typo';
import { spacingX, spacingY } from '@/constants/theme';

interface ExtendedHeaderProps extends HeaderProps {
  rightIcon?: React.ReactNode;
  titleSize?: number;
  titleAlign?: 'left' | 'center';
  backgroundColor?: string;
}

const Header = ({
  title = "",
  leftIcon,
  rightIcon,
  style,
  titleSize = 20,
  titleAlign = "center",
  backgroundColor
}: ExtendedHeaderProps) => {
  return (
    <View style={[
      styles.container, 
      backgroundColor && { backgroundColor },
      style
    ]}>
      <View style={styles.leftContainer}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      </View>
      
      <View style={[
        styles.titleContainer,
        titleAlign === 'left' && styles.titleLeft,
        !leftIcon && !rightIcon && { paddingHorizontal: 0 }
      ]}>
        {title && (
          <Typo
            size={titleSize}
            style={{
              fontWeight: "600",
              textAlign: titleAlign === 'center' ? 'center' : 'left',
            }}
            textProps={{
              numberOfLines: 1,
              ellipsizeMode: 'tail'
            }}
          >
            {title}
          </Typo>
        )}
      </View>
      
      <View style={styles.rightContainer}>
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Platform.OS === 'ios' ? spacingY._15 : spacingY._12,
    paddingHorizontal: spacingX._15,
  },
  leftContainer: {
    minWidth: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacingX._10,
  },
  titleLeft: {
    alignItems: 'flex-start',
  },
  rightContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  leftIcon: {
    justifyContent: 'center',
  },
  rightIcon: {
    justifyContent: 'center',
  }
});