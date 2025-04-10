import { colors } from '@/constants/theme';
import { ScreenWrapperProps } from '@/types'
import { StyleSheet, Text, View, Dimensions, Platform, ImageBackground, StatusBar } from 'react-native'

const { height } = Dimensions.get('window');

const ScreenWrapper = ({style, children} : ScreenWrapperProps) => {
    let paddingTop = Platform.OS === 'ios' ? height * 0.06 : 50;
    if (Platform.OS === 'android') {
        paddingTop = 0;
    }
  
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
        <StatusBar barStyle={'light-content'} />
        {children}
    </View>
    );
};

export default ScreenWrapper

const styles = StyleSheet.create({})