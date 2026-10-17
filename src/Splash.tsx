import {forwardRef, useCallback, useEffect, useState} from 'react'
import {AccessibilityInfo, useColorScheme, View} from 'react-native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Svg, {Path, type SvgProps} from 'react-native-svg'
import {scheduleOnRN} from 'react-native-worklets'
import * as SplashScreen from 'expo-splash-screen'

import {Logotype} from '#/view/icons/Logotype'
import {atoms as a} from '#/alf'

export const Logo = forwardRef(function LogoImpl(props: SvgProps, ref) {
  const width = 1000
  const height = width * (67 / 64)
  return (
    <Svg
      fill="none"
      // @ts-expect-error it's fiiiiine
      ref={ref}
      viewBox="0 0 64 66"
      style={[{width, height}, props.style]}>
      <Path
        fill={props.fill || '#fff'}
        fillOpacity={0.55}
        d="M33.5 13.2C35.8 9.9 39.7 7.8 44.1 7.8C50.5 7.8 55.9 12.4 57.1 18.5C61.0 19.6 63.8 23.2 63.8 27.5C63.8 31.6 61.2 35.1 57.5 36.3C56.1 29.3 50.8 23.9 43.9 23.2C41.8 18.5 38.1 14.9 33.5 13.2Z"
      />
      <Path
        fill={props.fill || '#fff'}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.5 49C6.6 49 1 43.4 1 36.5C1 30.4 5.4 25.3 11.2 24.2C13.2 16.5 20.2 10.8 28.6 10.8C37.5 10.8 45.0 17.1 46.6 25.5C47.5 25.3 48.5 25.2 49.5 25.2C56.4 25.2 62 30.8 62 37.7C62 44.0 57.3 49 51 49H13.5ZM10.5 38.8C16.5 38.8 21.2 34.6 27.8 34.6C34.4 34.6 39.2 38.8 45.8 38.8H52.5C53.5 38.8 54.3 39.6 54.3 40.6C54.3 41.6 53.5 42.4 52.5 42.4H45.8C38.2 42.4 33.4 38.2 27.8 38.2C22.2 38.2 17.5 42.4 10.5 42.4C9.5 42.4 8.7 41.6 8.7 40.6C8.7 39.6 9.5 38.8 10.5 38.8Z"
      />
      <Path
        fill={props.fill || '#fff'}
        fillOpacity={0.7}
        d="M15 53.8H36.5C37.6 53.8 38.5 54.7 38.5 55.8C38.5 56.9 37.6 57.8 36.5 57.8H15C13.9 57.8 13 56.9 13 55.8C13 54.7 13.9 53.8 15 53.8ZM43.5 53.8H50C51.1 53.8 52 54.7 52 55.8C52 56.9 51.1 57.8 50 57.8H43.5C42.4 57.8 41.5 56.9 41.5 55.8C41.5 54.7 42.4 53.8 43.5 53.8Z"
      />
    </Svg>
  )
})

type Props = {
  isReady: boolean
}

export function Splash(props: React.PropsWithChildren<Props>) {
  'use no memo'
  const insets = useSafeAreaInsets()
  const intro = useSharedValue(0)
  const outroLogo = useSharedValue(0)
  const outroApp = useSharedValue(0)
  const outroSplashOpacity = useSharedValue(0)
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)
  const [isLayoutReady, setIsLayoutReady] = useState(false)
  const [reduceMotion, setReduceMotion] = useState<boolean | undefined>(false)
  const isReady = props.isReady && isLayoutReady && reduceMotion !== undefined

  const colorScheme = useColorScheme()
  const isDarkMode = colorScheme === 'dark'

  const logoAnimation = useAnimatedStyle(() => {
    const introScale = interpolate(intro.get(), [0, 1], [0.8, 1], 'clamp')
    const outroScale =
      reduceMotion === true
        ? 1
        : interpolate(outroLogo.get(), [0, 0.08, 1], [1, 0.8, 500], 'clamp')

    const introOpacity = interpolate(intro.get(), [0, 1], [0, 1], 'clamp')
    const outroOpacity = interpolate(
      outroSplashOpacity.get(),
      [0, 0.1, 0.2, 1],
      [1, 1, 0, 0],
      'clamp',
    )

    return {
      opacity: introOpacity * outroOpacity,
      transform: [
        {translateY: -(insets.top / 2)},
        {scale: 0.1 * outroScale * introScale},
      ],
    }
  })
  const bottomLogoAnimation = useAnimatedStyle(() => {
    return {
      opacity: interpolate(intro.get(), [0, 1], [0, 1], 'clamp'),
    }
  })

  const splashAnimation = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        outroSplashOpacity.get(),
        [0, 0.1, 0.2, 1],
        [1, 1, 0, 0],
        'clamp',
      ),
    }
  })

  /**
   * Keep the app opaque so iOS blur/glass effects can initialize while the
   * splash hides it.
   */
  const appAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(outroApp.get(), [0, 1], [1.1, 1], 'clamp'),
        },
      ],
    }
  })

  const onFinish = useCallback(() => setIsAnimationComplete(true), [])
  const onLayout = useCallback(() => setIsLayoutReady(true), [])

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync()
        .then(() => {
          intro.set(
            withTiming(
              1,
              {duration: 400, easing: Easing.out(Easing.cubic)},
              () => {
                'worklet'
                // set these values to check animation at specific point
                outroLogo.set(
                  withTiming(
                    1,
                    {duration: 1200, easing: Easing.in(Easing.cubic)},
                    () => {
                      scheduleOnRN(onFinish)
                    },
                  ),
                )
                outroApp.set(
                  withTiming(1, {
                    duration: 1200,
                    easing: Easing.inOut(Easing.cubic),
                  }),
                )
                outroSplashOpacity.set(
                  withTiming(1, {
                    duration: 1200,
                    easing: Easing.in(Easing.cubic),
                  }),
                )
              },
            ),
          )
        })
        .catch(() => {})
    }
  }, [onFinish, intro, outroLogo, outroApp, outroSplashOpacity, isReady])

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
  }, [])

  // special off-spec color for dark mode
  const logoBg = isDarkMode ? '#14181F' : '#FAFBFC'

  return (
    <View style={{flex: 1}} onLayout={onLayout}>
      {isReady && (
        <Animated.View style={[{flex: 1}, appAnimation]}>
          {props.children}
        </Animated.View>
      )}

      {!isAnimationComplete && (
        <Animated.View
          style={[
            a.absolute,
            a.inset_0,
            {backgroundColor: isDarkMode ? '#152A42' : '#2B7AC9'},
            splashAnimation,
          ]}>
          <Animated.View
            style={[
              bottomLogoAnimation,
              {
                position: 'absolute',
                bottom: insets.bottom + 40,
                left: 0,
                right: 0,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
              },
            ]}>
            <Logotype fill="#fff" width={90} />
          </Animated.View>
        </Animated.View>
      )}

      {isReady && !isAnimationComplete && (
        <Animated.View
          style={[
            a.absolute,
            a.inset_0,
            logoAnimation,
            {
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}>
          <Logo fill={logoBg} />
        </Animated.View>
      )}
    </View>
  )
}
