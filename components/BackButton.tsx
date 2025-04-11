import { StyleSheet, Text, Touchable, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { BackButtonProps } from '@/types'
import { CaretLeft } from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import { colors, radius } from '@/constants/theme';
import { useRouter as userRouter } from 'expo-router'

const BackButton = ({
    style,
    iconSize = 26
}: BackButtonProps) => {
    const router = userRouter();
  return (
    
    <TouchableOpacity onPress={() => router.back()} style={[styles.button, style]}>
      <CaretLeft
        color={colors.white}
        size={verticalScale(iconSize)}
        weight='bold'
        />
    </TouchableOpacity>
  )
}

export default BackButton

const styles = StyleSheet.create({
    button:{
        backgroundColor: colors.neutral600,
        alignSelf: 'flex-start',
        borderRadius: radius._12,
        borderCurve: 'continuous',
        padding: 5,

    },
});