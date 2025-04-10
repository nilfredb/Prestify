import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const [shorterDimension, longerDimension] = SCREEN_WIDTH < SCREEN_HEIGHT 
? [SCREEN_WIDTH, SCREEN_HEIGHT] 
: [SCREEN_HEIGHT, SCREEN_WIDTH];

const guidelineBaseWidth = 375; // base width for scaling
const guidelineBaseHeight = 812;// base height for scaling

export const scale = (size: number) =>
    Math.round(
        PixelRatio.roundToNearestPixel(
            (shorterDimension / guidelineBaseWidth) * (size as number)
    )
);

export const verticalScale = (size: number) =>
    Math.round(
        PixelRatio.roundToNearestPixel(
            (longerDimension / guidelineBaseHeight) * (size as number)
    )
);