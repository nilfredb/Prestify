import { StyleSheet, Text, View, Pressable } from 'react-native';
import React, {useRef} from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { spacingX, spacingY, colors } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import BackButton from '@/components/BackButton';
import Input from '@/components/Input'; {/*This is ok, just a filename interferences*/}
import * as Icons from 'phosphor-react-native';
import Button from '@/components/Button';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useAuth } from '@/context/authContext';

const Register = () => {
    const emailRef = useRef("");
    const passwordRef = useRef("");
    const nameRef = useRef("");
    const [isLoading, setIsLoading] = React.useState(false);
    const router = useRouter();
    const {register:registerUser} = useAuth();

    const handleSubmit = async()=>{
        if(!emailRef.current || !passwordRef.current || !nameRef.current){
        Alert.alert("Sign up", "Please fill all the fields");
        return;
        }
        setIsLoading(true);
        const res = await registerUser(emailRef.current, passwordRef.current, nameRef.current);
        setIsLoading(false);
        console.log('register results', res);
        if(!res.success){
            Alert.alert("Sign up", res.msg);
        }

    };
        
  return (
    <ScreenWrapper>
        <View style={styles.container}>
            <BackButton iconSize={26} />
            <View style={{gap: 5, marginTop: spacingY._20}}>
                <Typo size={30} fontWeight={"800"} color={colors.text}>Let's</Typo>
                <Typo size={30} fontWeight={"800"} color={colors.text}>Get Started</Typo>

            </View>

            {/* Login button & Image*/}
            <View style={styles.form}>
                <Typo size={16} color={colors.textLighter}>Create an account to track your expenses</Typo>
                <Input 
                placeholder="Enter your name"
                onChangeText={value => nameRef.current = value}
                icon={
                <Icons.User
                    size={verticalScale(26)} 
                    color={colors.neutral300}
                    weight="fill"
                    />
                }
                />
                <Input 
                placeholder="Enter your email"
                onChangeText={value => emailRef.current = value}
                icon={
                <Icons.At 
                    size={verticalScale(26)} 
                    color={colors.neutral300}
                    weight="fill"
                    />
                }
                />
                 <Input 
                placeholder="Enter your password"
                secureTextEntry={true}
                onChangeText={value => passwordRef.current = value}
                icon={
                <Icons.Lock
                    size={verticalScale(26)} 
                    color={colors.neutral300}
                    weight="fill"
                    />
                }
                />


                <Button loading={isLoading} onPress={handleSubmit}>
                    <Typo size={21} color={colors.neutral950} fontWeight={"700"}>Sign Up</Typo>
                </Button>

        </View>

        {/*Footer*/}
        <View style={styles.footer}>
            <Typo size={15} >Already have an account? </Typo>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
                <Typo size={15} fontWeight={'700'} color={colors.primary}>Login!</Typo>
            </Pressable>
        </View>
    </View>
    </ScreenWrapper>
  );
};

export default Register;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: spacingY._30,
        paddingHorizontal:spacingX._20,
    },
    welcomeText: {
        fontSize: verticalScale(20),
        fontWeight: "bold",
        color: colors.text,
    },
    form: {
        gap: spacingY._20,
    },
    forgotPassword:{
        flexDirection: 'row',
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    },

    footerText:{
        textAlign: "center",
        color: colors.text,
        fontSize: verticalScale(15),
    },
});