import { Dimensions, PixelRatio } from 'react-native';

// Obtenemos las dimensiones de la pantalla
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Determinamos cuál es la dimensión más corta y la más larga
const [shorterDimension, longerDimension] = SCREEN_WIDTH < SCREEN_HEIGHT 
  ? [SCREEN_WIDTH, SCREEN_HEIGHT] 
  : [SCREEN_HEIGHT, SCREEN_WIDTH];

// Valores base para el escalado (diseño de referencia)
const guidelineBaseWidth = 375; // base width for scaling
const guidelineBaseHeight = 812; // base height for scaling
const guidelineBaseFontSize = 14; // base font size

/**
 * Escala proporcional para elementos que deben mantener la misma 
 * proporción horizontal independientemente del tamaño de la pantalla
 */
export const scale = (size: number) =>
  Math.round(
    PixelRatio.roundToNearestPixel(
      (shorterDimension / guidelineBaseWidth) * size
    )
  );

/**
 * Escala horizontal específica para elementos que deben mantener 
 * una relación con el ancho de la pantalla
 */
export const horizontalScale = (size: number) =>
  Math.round(
    PixelRatio.roundToNearestPixel(
      (SCREEN_WIDTH / guidelineBaseWidth) * size
    )
  );

/**
 * Escala vertical específica para elementos que deben mantener 
 * una relación con la altura de la pantalla
 */
export const verticalScale = (size: number) =>
  Math.round(
    PixelRatio.roundToNearestPixel(
      (longerDimension / guidelineBaseHeight) * size
    )
  );

/**
 * Escala moderada que reduce el factor de escala para tamaños grandes
 * Útil para tamaños de texto, márgenes y padding que no deben crecer 
 * linealmente con el tamaño de la pantalla
 */
export const moderateScale = (size: number, factor = 0.5) =>
  Math.round(
    PixelRatio.roundToNearestPixel(
      size + (scale(size) - size) * factor
    )
  );

/**
 * Escala para fuentes que tiene en cuenta la configuración de accesibilidad del usuario
 */
export const fontScale = (size: number) =>
  Math.round(
    PixelRatio.roundToNearestPixel(
      size * PixelRatio.getFontScale()
    )
  );