import { colors } from '@/constants/theme'
import { ScreenWrapperProps } from '@/types'
import { StyleSheet, View, Dimensions, Platform, StatusBar } from 'react-native'
import * as SystemUI from 'expo-system-ui'
import React, { useEffect } from 'react'

const { height } = Dimensions.get('window')

const ScreenWrapper = ({ style, children }: ScreenWrapperProps) => {
  let paddingTop = Platform.OS === 'android' ? height * 0.06 : 50
  if (Platform.OS === 'android') {
    paddingTop = 0
  }

  // 👇 Este useEffect debe estar aquí dentro
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.neutral950)
  }, [])

  return (
    <View
      style={[
        {
          paddingTop,
          flex: 1,
          backgroundColor: colors.neutral950,
        },
        style,
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.neutral950}
        translucent={false}
      />
      {children}
    </View>
  )
}

export default ScreenWrapper

const styles = StyleSheet.create({})
