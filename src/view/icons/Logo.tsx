import {forwardRef} from 'react'
import {type TextProps} from 'react-native'
import Svg, {
  Defs,
  LinearGradient,
  Path,
  type PathProps,
  Stop,
  type SvgProps,
} from 'react-native-svg'

import {flatten, useTheme} from '#/alf'

const ratio = 57 / 64

type Props = {
  allowVariants?: boolean
  fill?: PathProps['fill']
  style?: TextProps['style']
} & Omit<SvgProps, 'style'>

export const Logo = forwardRef(function LogoImpl(props: Props, ref) {
  const t = useTheme()
  const {allowVariants: _allowVariants, fill, ...rest} = props
  const styles = flatten(props.style)
  const useBrandGradient = !fill || fill === 'sky'
  const mainFill = useBrandGradient
    ? 'url(#overcastMain)'
    : fill || styles?.color || t.palette.primary_500
  const accentFill = useBrandGradient ? 'url(#overcastAccent)' : mainFill
  // @ts-expect-error it's fiiiiine
  const size = parseInt(rest.width || 32, 10)

  return (
    <Svg
      fill="none"
      // @ts-expect-error it's fiiiiine
      ref={ref}
      viewBox="0 0 64 57"
      {...rest}
      style={[{width: size, height: size * ratio}, styles]}>
      {useBrandGradient && (
        <Defs>
          <LinearGradient id="overcastMain" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#2B7AC9" stopOpacity="1" />
            <Stop offset="0.55" stopColor="#3B6E9C" stopOpacity="1" />
            <Stop offset="1" stopColor="#526277" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="overcastAccent" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#6BAEE7" stopOpacity="1" />
            <Stop offset="1" stopColor="#2B7AC9" stopOpacity="1" />
          </LinearGradient>
        </Defs>
      )}

      {/* Precision-offset upper-right sky-blue cloud crest */}
      <Path
        fill={accentFill}
        fillOpacity={useBrandGradient ? 0.95 : 0.55}
        d="M33.5 9.2C35.8 5.9 39.7 3.8 44.1 3.8C50.5 3.8 55.9 8.4 57.1 14.5C61.0 15.6 63.8 19.2 63.8 23.5C63.8 27.6 61.2 31.1 57.5 32.3C56.1 25.3 50.8 19.9 43.9 19.2C41.8 14.5 38.1 10.9 33.5 9.2Z"
      />

      {/* Sculpted main cloud with negative-space S-curve breeze channel */}
      <Path
        fill={mainFill}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.5 45C6.6 45 1 39.4 1 32.5C1 26.4 5.4 21.3 11.2 20.2C13.2 12.5 20.2 6.8 28.6 6.8C37.5 6.8 45.0 13.1 46.6 21.5C47.5 21.3 48.5 21.2 49.5 21.2C56.4 21.2 62 26.8 62 33.7C62 40.0 57.3 45 51 45H13.5ZM10.5 34.8C16.5 34.8 21.2 30.6 27.8 30.6C34.4 30.6 39.2 34.8 45.8 34.8H52.5C53.5 34.8 54.3 35.6 54.3 36.6C54.3 37.6 53.5 38.4 52.5 38.4H45.8C38.2 38.4 33.4 34.2 27.8 34.2C22.2 34.2 17.5 38.4 10.5 38.4C9.5 38.4 8.7 37.6 8.7 36.6C8.7 35.6 9.5 34.8 10.5 34.8Z"
      />

      {/* Modern segmented horizon mist bar */}
      <Path
        fill={accentFill}
        fillOpacity={useBrandGradient ? 0.85 : 0.65}
        d="M15 49.8H36.5C37.6 49.8 38.5 50.7 38.5 51.8C38.5 52.9 37.6 53.8 36.5 53.8H15C13.9 53.8 13 52.9 13 51.8C13 50.7 13.9 49.8 15 49.8ZM43.5 49.8H50C51.1 49.8 52 50.7 52 51.8C52 52.9 51.1 53.8 50 53.8H43.5C42.4 53.8 41.5 52.9 41.5 51.8C41.5 50.7 42.4 49.8 43.5 49.8Z"
      />
    </Svg>
  )
})
