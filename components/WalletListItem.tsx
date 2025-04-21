import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Router } from 'expo-router'
import { WalletType } from '@/types'
import { TouchableOpacity } from 'react-native'
import { verticalScale } from '@/utils/styling'
import { colors, radius, spacingX } from '@/constants/theme'
import Typo from './Typo'
import { Image } from 'expo-image'
import * as Icons from 'phosphor-react-native'
import { FadeInDown} from 'react-native-reanimated'
import  Animated  from 'react-native-reanimated'


const WalletListItem = ({
    item,
    index,
    router
}:{
    item: WalletType,
    index: number,
    router: Router
}) => {

    const openWallet = () => {
        router.push({
            pathname: `../(modals)/walletModal`, 
            params: {
                id: item?.id,
                name: item?.name,
                image: item?.image,
            }
        });
    };

  return (
    <Animated.View
    entering={FadeInDown.delay(index * 50)
    .springify()
    .damping(13)}
    >
      <TouchableOpacity style={styles.container} onPress={openWallet}>
        <View style={styles.imageContainer}>
            <Image
            style={{ flex: 1 }}
            source={item?.image}
            contentFit="cover"
            transition={100}
            />
        </View>
        <View style={styles.nameContainer}>
            <Typo size={16}>{item?.name}</Typo>
            <Typo size={14} color={colors.neutral400}>${item?.amount}</Typo>

        </View>
        <Icons.CaretRight
            size={verticalScale(20)}
            color={colors.white}
            weight="thin"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default WalletListItem;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(20),
    },
    imageContainer: {
        width: verticalScale(45),
        height: verticalScale(45),
        borderRadius: radius._15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.neutral600,
        borderCurve: 'continuous',
    },
    nameContainer: {
        flex: 1,
        marginLeft: spacingX._10,
        gap: 2
    },
})