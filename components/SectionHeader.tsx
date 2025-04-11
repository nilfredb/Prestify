import { View, StyleSheet, Pressable } from 'react-native'
import React from 'react'
import Typo from './Typo'
import { spacingY } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'
import { colors } from '@/constants/theme'

type SectionHeaderProps = {
  title: string;
  right?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

const SectionHeader = ({ title, right, actionText, onAction }: SectionHeaderProps) => {
  return (
    <View style={styles.container}>
      <Typo size={18} fontWeight="700" color={colors.text}>
        {title}
      </Typo>
      
      {actionText && onAction ? (
        <Pressable onPress={onAction}>
          <Typo size={14} color={colors.primary}>
            {actionText}
          </Typo>
        </Pressable>
      ) : right ? (
        <View>{right}</View>
      ) : null}
    </View>
  )
}

export default SectionHeader

const styles = StyleSheet.create({
  container: {
    marginBottom: spacingY._15,
    marginTop: spacingY._15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})