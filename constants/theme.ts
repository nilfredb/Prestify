import { scale, verticalScale } from "@/utils/styling";

export const colors = {
  /* branding */
  primary:        '#2563EB', // Indigo 600 – confianza, modernidad
  primaryLight:   '#60A5FA', // Indigo 400 – hover / focus
  primaryDark:    '#1E40AF', // Indigo 800 – headers, emphasis

  accent:         '#FACC15', // Amber 400 – llamada a la acción
  accentDark:     '#CA8A04', // Amber 700

  /* text */
  text:           '#F9FAFB', // casi blanco
  textLight:      '#E5E7EB',
  textLighter:    '#D1D5DB',

  /* feedback */
  success:        '#10B981', // Emerald 500
  warning:        '#F97316', // Orange 500
  danger:         '#EF4444', // Red 500

  /* neutrals */
  neutral50:  '#F9FAFB',
  neutral100: '#F3F4F6',
  neutral200: '#E5E7EB',
  neutral300: '#D1D5DB',
  neutral400: '#9CA3AF',
  neutral500: '#6B7280',
  neutral600: '#4B5563',
  neutral700: '#374151',
  neutral800: '#1F2937',
  neutral900: '#111827',
  neutral950: '#0B1120',

  /* utility */
  white: '#FFFFFF',
  black: '#000000',
};


export const spacingX = {
  _3: scale(3),
  _5: scale(5),
  _7: scale(7),
  _10: scale(10),
  _12: scale(12),
  _15: scale(15),
  _20: scale(20),
  _25: scale(25),
  _30: scale(30),
  _35: scale(35),
  _40: scale(40),
};

export const spacingY = {
  _5: verticalScale(5),
  _7: verticalScale(7),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _25: verticalScale(25),
  _30: verticalScale(30),
  _35: verticalScale(35),
  _40: verticalScale(40),
  _50: verticalScale(50),
  _60: verticalScale(60),
};

export const radius = {
  _3: verticalScale(3),
  _6: verticalScale(6),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _30: verticalScale(30),
};
