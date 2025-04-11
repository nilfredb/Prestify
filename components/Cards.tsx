import { View, StyleSheet } from 'react-native'
import React from 'react'
import Typo from './Typo'
import { colors } from '@/constants/theme'
import { spacingX, spacingY } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'

type CardProps = {
  title: string
  value: string | number
  icon: React.ReactNode
}

const Card = ({ title, value, icon }: CardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>{icon}</View>

      <View style={styles.textContainer}>
        <Typo size={16} fontWeight="600" color={colors.textLighter}>
          {title}
        </Typo>
        <Typo size={22} fontWeight="800" color={colors.text}>
          {value}
        </Typo>
      </View>
    </View>
  )
}

export default Card

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral900,
    borderRadius: 16,
    padding: spacingY._20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    backgroundColor: colors.neutral800,
    padding: spacingY._15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
})
