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
        d="M32 5.2C33.2 5.2 34.2 6.2 34.2 7.4V9.2H29.8V7.4C29.8 6.2 30.8 5.2 32 5.2ZM36.2 10.2C47.8 11.5 57.5 18.9 61.2 29.4C58.1 27.3 53.9 27.0 50.4 28.8C46.2 19.8 41.5 13.6 36.2 10.2Z"
      />
      <Path
        fill={props.fill || '#fff'}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32 10.8C48.8 10.8 62 23.6 62 38.8C62 39.8 61.0 40.5 60.1 40.0C57.6 38.2 54.6 37.4 51.8 37.4C49.0 37.4 46.2 38.3 43.8 40.0C43.1 40.5 42.1 40.5 41.4 40.0C38.8 38.2 35.4 37.4 32 37.4C28.6 37.4 25.2 38.2 22.6 40.0C21.9 40.5 20.9 40.5 20.2 40.0C17.8 38.3 15.0 37.4 12.2 37.4C9.4 37.4 6.4 38.2 3.9 40.0C3.0 40.5 2 39.8 2 38.8C2 23.6 15.2 10.8 32 10.8ZM13.5 29.2C18.8 29.2 23.2 25.4 29.5 25.4C35.8 25.4 40.2 29.2 46.5 29.2H51.2C52.2 29.2 53.0 30.0 53.0 31.0C53.0 32.0 52.2 32.8 51.2 32.8H46.5C39.2 32.8 34.8 29.0 29.5 29.0C24.2 29.0 19.8 32.8 13.5 32.8C12.5 32.8 11.7 32.0 11.7 31.0C11.7 30.0 12.5 29.2 13.5 29.2Z"
      />
      <Path
        fill={props.fill || '#fff'}
        fillOpacity={0.75}
        d="M29.8 37.2H34.2V50.2C34.2 55.5 29.9 59.5 24.6 59.5C19.3 59.5 15.2 55.5 15.2 50.4C15.2 49.2 16.2 48.2 17.4 48.2C18.6 48.2 19.6 49.2 19.6 50.4C19.6 53.1 21.8 55.1 24.6 55.1C27.4 55.1 29.8 53.1 29.8 50.2V37.2ZM41.5 52.2H49.5C50.7 52.2 51.7 53.2 51.7 54.4C51.7 55.6 50.7 56.6 49.5 56.6H41.5C40.3 56.6 39.3 55.6 39.3 54.4C39.3 53.2 40.3 52.2 41.5 52.2Z"
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
