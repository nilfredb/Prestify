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

const Login = () => {
    const emailRef = useRef("");
    const passwordRef = useRef("");
    const [isLoading, setIsLoading] = React.useState(false);
    const router = useRouter();

    const handleSubmit = async()=>{
        if(!emailRef.current || !passwordRef.current){
        Alert.alert("Login", "Please fill all the fields");
        return;
        }
        console.log("email", emailRef.current);
        console.log("password", passwordRef.current);
        console.log("Login successful!");

    };
        
  return (
    <ScreenWrapper>
        <View style={styles.container}>
            <BackButton iconSize={26} />
            <View style={{gap: 5, marginTop: spacingY._20}}>
                <Typo size={30} fontWeight={"800"} color={colors.text}>Hey,</Typo>
                <Typo size={30} fontWeight={"800"} color={colors.text}>Welcome Back</Typo>

            </View>

            {/* Login button & Image*/}
            <View style={styles.form}>
                <Typo size={16} color={colors.textLighter}>Login now to track all your expenses</Typo>
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
                <Typo size={14} color={colors.text} style={{alignSelf: "flex-end"}}>
                    Forgot Password?
                </Typo>

                <Button loading={isLoading} onPress={handleSubmit}>
                    <Typo size={21} color={colors.neutral950} fontWeight={"700"}>Login</Typo>
                </Button>

        </View>

        {/*Footer*/}
        <View style={styles.footer}>
            <Typo size={15} >Don't have an account? </Typo>
            <Pressable onPress={() => router.replace('/(auth)/register')}>
                <Typo size={15} fontWeight={'700'} color={colors.primary}>Create one!</Typo>
            </Pressable>
        </View>
    </View>
    </ScreenWrapper>
  );
};

export default Login;

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