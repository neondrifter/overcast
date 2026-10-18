import {
  createThemes,
  DEFAULT_PALETTE,
  DEFAULT_SUBDUED_PALETTE,
  type Palette,
} from '@bsky.app/alf'

const OVERCAST_PALETTE: Palette = {
  ...DEFAULT_PALETTE,
  contrast_0: '#FAFBFC',
  contrast_25: '#F3F6F9',
  contrast_50: '#EAEFF5',
  contrast_100: '#DAE2EC',
  contrast_200: '#C0CCD9',
  contrast_300: '#A3B2C4',
  contrast_400: '#8596AC',
  contrast_500: '#677990',
  contrast_600: '#526277',
  contrast_700: '#3F4D5F',
  contrast_800: '#2E3A48',
  contrast_900: '#202935',
  contrast_950: '#171E27',
  contrast_975: '#10161D',
  contrast_1000: '#0A0E14',
  primary_25: '#F2F8FD',
  primary_50: '#E3F0FB',
  primary_100: '#C6E0F7',
  primary_200: '#9BC8F0',
  primary_300: '#6BAEE7',
  primary_400: '#4593DC',
  primary_500: '#2B7AC9',
  primary_600: '#2164AB',
  primary_700: '#1A4F8B',
  primary_800: '#153E6E',
  primary_900: '#102E52',
  primary_950: '#0C213B',
  primary_975: '#081628',
}

const OVERCAST_SUBDUED_PALETTE: Palette = {
  ...DEFAULT_SUBDUED_PALETTE,
  contrast_0: '#FAFBFC',
  contrast_25: '#F3F6F9',
  contrast_50: '#EBF0F5',
  contrast_100: '#DCE3EC',
  contrast_200: '#C2CEDB',
  contrast_300: '#A8B7C7',
  contrast_400: '#8B9CB0',
  contrast_500: '#6E8096',
  contrast_600: '#58697E',
  contrast_700: '#465568',
  contrast_800: '#364353',
  contrast_900: '#283340',
  contrast_950: '#1F2833',
  contrast_975: '#19212B',
  contrast_1000: '#131922',
  primary_25: '#F2F8FD',
  primary_50: '#E5F1FB',
  primary_100: '#CAE2F8',
  primary_200: '#9FCBF1',
  primary_300: '#72B2E8',
  primary_400: '#4B97DF',
  primary_500: '#317FCE',
  primary_600: '#2568B0',
  primary_700: '#1E5490',
  primary_800: '#184373',
  primary_900: '#133358',
  primary_950: '#0F2642',
  primary_975: '#0B1C31',
}

const DEFAULT_THEMES = createThemes({
  defaultPalette: OVERCAST_PALETTE,
  subduedPalette: OVERCAST_SUBDUED_PALETTE,
})

export const themes = {
  lightPalette: DEFAULT_THEMES.light.palette,
  darkPalette: DEFAULT_THEMES.dark.palette,
  dimPalette: DEFAULT_THEMES.dim.palette,
  light: DEFAULT_THEMES.light,
  dark: DEFAULT_THEMES.dark,
  dim: DEFAULT_THEMES.dim,
}

/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const lightPalette = DEFAULT_THEMES.light.palette
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const darkPalette = DEFAULT_THEMES.dark.palette
/**
 * @deprecated use ALF and access palette from `useTheme()`
 */
export const dimPalette = DEFAULT_THEMES.dim.palette
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const light = DEFAULT_THEMES.light
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const dark = DEFAULT_THEMES.dark
/**
 * @deprecated use ALF and access theme from `useTheme()`
 */
export const dim = DEFAULT_THEMES.dim
