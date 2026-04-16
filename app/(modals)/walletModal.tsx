import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import ModalWrapper from '@/components/ModalWrapper';
import { spacingY, colors } from '@/constants/theme';
import { scale, verticalScale } from '@/utils/styling';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { Scroll } from 'phosphor-react-native';
import { ScrollView } from 'moti';
import { getProfileImage } from '@/services/imageServices';
import { Image } from 'expo-image';
import * as Icon from 'phosphor-react-native';
import Typo from '@/components/Typo';
import Input from '@/components/Input';
import {useState} from 'react';
import { UserDataType, WalletType } from '@/types';
import Button from '@/components/Button';
import { useAuth } from '@/context/authContext';
import { Alert } from 'react-native';
import { updateUser } from '@/services/userService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ImageUpload from '@/components/ImageUpload';
import { createOrUpdateWallet } from '@/services/walletService';

const walletModal = () => {
    const {user, updateUserData} = useAuth();
    const [wallet, setWallet] = useState<WalletType>({
        name: "",
        image: null,
    });

    const[loading, setLoading] = useState(false);
    const router = useRouter();
    const oldWallet: {name: string, image: string, id: string} = useLocalSearchParams();
    useLocalSearchParams();

    useEffect(() => {
        if(oldWallet?.id){
            setWallet({
                name: oldWallet?.name,
                image: oldWallet?.image,
            });
        }

    },[]);

    const onSubmit = async () => {
        let{name, image} = wallet;
        if(!name.trim() || !image){
            Alert.alert("Wallet", "Please enter your wallet name and image");
            return;
        }

        const data: WalletType = {
            name,
            image,
            uid: user?.uid,
        };
        if(oldWallet?.id){
            data.id = oldWallet?.id;
        }
        setLoading(true);
        const res = await createOrUpdateWallet(data);
        setLoading(false);
        console.log ('register results', res);
        if(res.success){
            router.back();
    }else{
            Alert.alert("Wallet", res.msg);
        }
    }

  return (
    <ModalWrapper>
      <View style={styles.constainer}>
      <Header title={oldWallet?.id ? "Update Wallet": "New Wallet"} leftIcon={<BackButton />} style={{ marginBottom: spacingY._10}}/>

      <ScrollView contentContainerStyle={styles.form}>
        
        <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Wallet Name</Typo>
            <Input
                placeholder="Wallet Name"
                value={wallet.name}
                onChangeText={(value) => setWallet({...wallet, name: value})}
                />
            </View>
            <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Wallet Icon</Typo>
            <ImageUpload file= {wallet.image} onClear={()=>setWallet({...wallet,image: null})}onSelect={file=> setWallet({...wallet, image: file})} placeholder='Upload Image'/>
          {/* <Input*/}
            </View>
      </ScrollView>
      </View>
      <View style={styles.footer}>
        <Button onPress={onSubmit} loading={loading} style={{flex:1}}>
            <Typo size={22} color={colors.black} fontWeight={"700"}>{oldWallet?.id ? "Update Wallet" : "Add Wallet"}</Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};

export default walletModal

const styles = StyleSheet.create({
    constainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacingY._20,
        //paddingVertical: spacingY._10,
    },
    footer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: spacingY._20,
        gap: scale(12),
        paddingTop: spacingY._15,
        borderTopColor: colors.neutral700,
    },
    form:{
        gap: spacingY._30,
        marginBottom: spacingY._15,
    },
    avatarContainer:{
        alignSelf: 'center',
        position: 'relative',
    },
    avatar:{
        alignSelf: 'center',
        backgroundColor: colors.neutral300,
        width: verticalScale(135),
        height: verticalScale(135),
        borderRadius: 200,
        borderWidth: 1,
        borderColor: colors.neutral500,
    },

    editIcon:{
        position: 'absolute',
        bottom: spacingY._5,
        right: spacingY._7,
        backgroundColor: colors.neutral100,
        borderRadius: 100,
        shadowColor: colors.black,
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
        padding: spacingY._7,

    },
    inputContainer:{
        gap: spacingY._10,
    },
});