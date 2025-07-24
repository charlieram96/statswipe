export const FONTS = {
  orbitron: {
    regular: 'Orbitron-Regular',
    medium: 'Orbitron-Medium', 
    bold: 'Orbitron-Bold',
  },
  inter: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
} as const;

// Alternative font weights using CSS font-weight
export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  bold: '700',
} as const;

export type OrbitronFontFamily = typeof FONTS.orbitron[keyof typeof FONTS.orbitron];
export type InterFontFamily = typeof FONTS.inter[keyof typeof FONTS.inter];
export type FontFamily = OrbitronFontFamily | InterFontFamily;