import {useEffect, useRef, useState} from 'react'
import {
  type GestureResponderEvent,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg'
import {Trans, useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {useHideMediaEnabled} from '#/state/preferences'
import {EventStopper} from '#/view/com/util/EventStopper'
import {atoms as a, useTheme, web} from '#/alf'
import {Text} from '#/components/Typography'

export type OvercastMediaKind = 'image' | 'video' | 'gif' | 'thumbnail'

const DISSIPATE_DURATION_MS = 550

/**
 * Wraps post media (images, videos, GIFs, link-card thumbnails) with an
 * overcast cloud cover when the global "Hide media in posts" setting is
 * enabled. Tapping the cloud cover causes the clouds to part and fade away,
 * revealing the media for that post, with a corner toggle to re-hide it.
 */
export function OvercastMediaHider({
  kind = 'image',
  rounded = true,
  style,
  children,
}: {
  kind?: OvercastMediaKind
  rounded?: boolean
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  const hideMediaEnabled = useHideMediaEnabled()
  const t = useTheme()
  const {t: l} = useLingui()
  const haptics = useHaptics()

  const [isRevealed, setIsRevealed] = useState(false)
  const [isOverlayMounted, setIsOverlayMounted] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /*
   * 0 = fully obscured by overcast clouds
   * 1 = clouds have dissipated and faded away
   */
  const progress = useSharedValue(0)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  // Reset per-post state if the user toggles the global preference
  useEffect(() => {
    if (hideMediaEnabled) {
      setIsRevealed(false)
      setIsOverlayMounted(true)
      progress.set(0)
    }
  }, [hideMediaEnabled, progress])

  const backdropStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: 1 - p,
    }
  })

  const leftBackCloudStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.15),
      transform: [
        {translateX: -95 * p},
        {translateY: -22 * p},
        {scale: 1 + 0.1 * p},
      ],
    }
  })

  const rightBackCloudStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.15),
      transform: [
        {translateX: 95 * p},
        {translateY: -20 * p},
        {scale: 1 + 0.1 * p},
      ],
    }
  })

  const leftFrontCloudStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.05),
      transform: [
        {translateX: -135 * p},
        {translateY: 18 * p},
        {scale: 1 + 0.14 * p},
      ],
    }
  })

  const rightFrontCloudStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.05),
      transform: [
        {translateX: 135 * p},
        {translateY: 20 * p},
        {scale: 1 + 0.14 * p},
      ],
    }
  })

  const centerPromptStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.6),
      transform: [{translateY: -10 * p}, {scale: 1 - 0.08 * p}],
    }
  })

  if (!hideMediaEnabled) {
    return <>{children}</>
  }

  const handleReveal = (e: GestureResponderEvent) => {
    e.preventDefault()
    e.stopPropagation()
    haptics.tap()

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    setIsRevealed(true)
    setIsOverlayMounted(true)
    progress.set(
      withTiming(1, {
        duration: DISSIPATE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      }),
    )

    timerRef.current = setTimeout(() => {
      setIsOverlayMounted(false)
    }, DISSIPATE_DURATION_MS)
  }

  const handleRehide = (e: GestureResponderEvent) => {
    e.preventDefault()
    e.stopPropagation()
    haptics.tap()

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    setIsOverlayMounted(true)
    progress.set(
      withTiming(0, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
      }),
    )

    timerRef.current = setTimeout(() => {
      setIsRevealed(false)
    }, 320)
  }

  const isDark = t.name !== 'light'
  const skyTopColor = isDark ? '#15273D' : '#CFE3F7'
  const skyBottomColor = isDark ? t.palette.contrast_100 : '#EAF1F8'
  const sunbreakGlowColor = isDark ? '#2B7AC9' : '#8CC5F2'
  const backCloudColor = isDark ? '#1F3B5C' : '#9DC2E6'
  const midCloudColor = isDark ? '#2C4869' : '#C2D6EC'
  const frontCloudColor = isDark ? t.palette.contrast_200 : '#F4F8FC'
  const badgeBgColor = isDark
    ? 'rgba(15, 22, 32, 0.84)'
    : 'rgba(255, 255, 255, 0.92)'
  const badgeBorderColor = isDark
    ? 'rgba(69, 147, 220, 0.35)'
    : 'rgba(43, 122, 201, 0.25)'
  const accentBlue = isDark ? t.palette.primary_400 : t.palette.primary_500

  const actionLabel =
    kind === 'video'
      ? l`Reveal video`
      : kind === 'gif'
        ? l`Reveal GIF`
        : kind === 'thumbnail'
          ? l`Reveal preview image`
          : l`Reveal image`

  return (
    <View
      style={[
        a.relative,
        a.overflow_hidden,
        rounded && a.rounded_md,
        !isRevealed &&
          (kind === 'thumbnail' ? a.aspect_card : {minHeight: 200}),
        style,
      ]}>
      {isRevealed ? children : null}

      {isRevealed && !isOverlayMounted && (
        <EventStopper
          style={[
            a.absolute,
            {
              top: 8,
              right: 8,
              zIndex: 20,
            },
          ]}>
          <Pressable
            onPress={handleRehide}
            accessibilityRole="button"
            accessibilityLabel={l`Hide media`}
            accessibilityHint={l`Obscures this media behind overcast clouds again`}
            style={({pressed}) => [
              a.flex_row,
              a.align_center,
              a.gap_xs,
              a.px_sm,
              a.py_xs,
              a.rounded_full,
              a.border,
              {
                backgroundColor: badgeBgColor,
                borderColor: badgeBorderColor,
                opacity: pressed ? 1 : 0.88,
              },
              web({cursor: 'pointer'}),
            ]}>
            <OvercastGlyph
              size={14}
              color={t.atoms.text.color}
              accentColor={accentBlue}
            />
            <Text style={[a.text_xs, a.font_semi_bold, t.atoms.text]}>
              <Trans>Hide</Trans>
            </Text>
          </Pressable>
        </EventStopper>
      )}

      {isOverlayMounted && (
        <EventStopper
          style={[
            a.absolute,
            a.inset_0,
            {zIndex: 15},
            isRevealed ? a.pointer_events_none : {},
          ]}>
          <Pressable
            onPress={handleReveal}
            disabled={isRevealed}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            accessibilityHint={l`Clears the overcast clouds to show the media`}
            style={[
              a.flex_1,
              a.align_center,
              a.justify_center,
              a.overflow_hidden,
              web({cursor: 'pointer'}),
            ]}>
            {/* Overcast sky backdrop with atmospheric blue gradient */}
            <Animated.View
              style={[
                a.absolute,
                a.inset_0,
                {backgroundColor: skyBottomColor},
                backdropStyle,
              ]}>
              <Svg
                viewBox="0 0 400 240"
                width="100%"
                height="100%"
                preserveAspectRatio="none">
                <Defs>
                  <LinearGradient
                    id="overcastMediaSky"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">
                    <Stop offset="0" stopColor={skyTopColor} stopOpacity="1" />
                    <Stop
                      offset="1"
                      stopColor={skyBottomColor}
                      stopOpacity="1"
                    />
                  </LinearGradient>
                </Defs>
                <Rect width="400" height="240" fill="url(#overcastMediaSky)" />
                <Circle
                  cx="200"
                  cy="75"
                  r="95"
                  fill={sunbreakGlowColor}
                  fillOpacity={isDark ? 0.18 : 0.25}
                />
              </Svg>
            </Animated.View>

            {/* Upper-left background cloud bank */}
            <Animated.View
              style={[
                a.absolute,
                {
                  top: -18,
                  left: -28,
                  width: '72%',
                  height: 140,
                },
                leftBackCloudStyle,
              ]}>
              <Svg
                viewBox="0 0 320 140"
                width="100%"
                height="100%"
                preserveAspectRatio="none">
                <Path
                  fill={backCloudColor}
                  d="M0 0h320v45c-18 22-48 34-82 30-24 26-66 36-104 22-28 20-68 24-102 8C18 98 7 86 0 72V0Z"
                />
                <Path
                  fill={midCloudColor}
                  opacity={0.78}
                  d="M-10 20c32-12 68-4 88 18 22-14 54-12 76 6 26-10 56 2 68 24 14 26-8 52-40 50H-10V20Z"
                />
              </Svg>
            </Animated.View>

            {/* Upper-right background cloud bank */}
            <Animated.View
              style={[
                a.absolute,
                {
                  top: -14,
                  right: -28,
                  width: '72%',
                  height: 145,
                },
                rightBackCloudStyle,
              ]}>
              <Svg
                viewBox="0 0 320 145"
                width="100%"
                height="100%"
                preserveAspectRatio="none">
                <Path
                  fill={backCloudColor}
                  d="M320 0H0v48c20 20 52 30 86 24 26 28 70 38 108 22 28 18 66 20 98 4 12-6 22-16 28-28V0Z"
                />
                <Path
                  fill={midCloudColor}
                  opacity={0.82}
                  d="M330 28c-30-14-66-6-86 16-24-16-58-14-80 6-24-8-54 4-64 26-12 24 10 48 42 46h188V28Z"
                />
              </Svg>
            </Animated.View>

            {/* Lower-left foreground rolling clouds */}
            <Animated.View
              style={[
                a.absolute,
                {
                  bottom: -22,
                  left: -32,
                  width: '76%',
                  height: 150,
                },
                leftFrontCloudStyle,
              ]}>
              <Svg
                viewBox="0 0 340 150"
                width="100%"
                height="100%"
                preserveAspectRatio="none">
                <Path
                  fill={midCloudColor}
                  d="M0 150h340v-42c-22-24-58-34-94-26-26-30-72-40-112-22-30-22-72-24-106-6-12 6-21 15-28 26v70Z"
                />
                <Path
                  fill={frontCloudColor}
                  opacity={0.92}
                  d="M-10 150h290c18-22 4-52-24-56-16-26-52-34-80-18-24-24-66-26-92-4-26-14-62-4-74 22v56Z"
                />
              </Svg>
            </Animated.View>

            {/* Lower-right foreground rolling clouds */}
            <Animated.View
              style={[
                a.absolute,
                {
                  bottom: -20,
                  right: -32,
                  width: '76%',
                  height: 150,
                },
                rightFrontCloudStyle,
              ]}>
              <Svg
                viewBox="0 0 340 150"
                width="100%"
                height="100%"
                preserveAspectRatio="none">
                <Path
                  fill={midCloudColor}
                  d="M340 150H0v-40c24-22 60-32 96-24 28-28 74-38 114-20 28-20 68-22 102-4 12 6 21 15 28 26v62Z"
                />
                <Path
                  fill={frontCloudColor}
                  opacity={0.92}
                  d="M350 150H60c-18-20-4-50 24-54 18-24 54-32 82-16 24-22 64-24 90-2 26-12 60-2 74 22v50Z"
                />
              </Svg>
            </Animated.View>

            {/* Center overcast badge and prompt */}
            <Animated.View
              style={[
                a.align_center,
                a.justify_center,
                a.px_lg,
                a.py_md,
                a.rounded_lg,
                a.border,
                a.gap_xs,
                {
                  backgroundColor: badgeBgColor,
                  borderColor: badgeBorderColor,
                },
                centerPromptStyle,
              ]}>
              <OvercastGlyph
                size={34}
                color={t.atoms.text.color}
                accentColor={accentBlue}
              />
              <Text
                style={[
                  a.text_sm,
                  a.font_semi_bold,
                  a.text_center,
                  t.atoms.text,
                ]}>
                {kind === 'video' ? (
                  <Trans>Video hidden by Overcast</Trans>
                ) : kind === 'gif' ? (
                  <Trans>GIF hidden by Overcast</Trans>
                ) : kind === 'thumbnail' ? (
                  <Trans>Preview hidden by Overcast</Trans>
                ) : (
                  <Trans>Image hidden by Overcast</Trans>
                )}
              </Text>
              <Text
                style={[
                  a.text_xs,
                  a.font_medium,
                  a.text_center,
                  {color: accentBlue},
                ]}>
                <Trans>Tap to clear the clouds</Trans>
              </Text>
            </Animated.View>
          </Pressable>
        </EventStopper>
      )}
    </View>
  )
}

function OvercastGlyph({
  size = 28,
  color,
  accentColor,
}: {
  size?: number
  color: string
  accentColor?: string
}) {
  const skyAccent = accentColor ?? color
  return (
    <Svg viewBox="0 0 64 58" width={size} height={(size * 58) / 64} fill="none">
      {/* Upper-right sky-blue cloud crest */}
      <Path
        fill={skyAccent}
        d="M33.5 9.2C36.8 6.4 41.2 5.2 45.6 6.2 50.6 7.3 54.4 11.4 55.2 16.5 58.9 17.6 61.5 21 61.5 25 61.5 29.4 58.3 33.1 54 33.8 53.3 29.2 49.8 25.5 45.1 24.5 43.3 17.5 38.6 12.1 33.5 9.2Z"
      />
      {/* Main sculpted cloud with negative-space breeze channel */}
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M27.5 11.5C19.6 11.5 13 17.2 11.6 24.8 6.1 25.8 2 30.6 2 36.4 2 42.8 7.2 48 13.6 48H43.5C50.4 48 56 42.4 56 35.5 56 29.1 51.2 23.8 44.9 23.1 42.6 16.3 35.7 11.5 27.5 11.5ZM14.5 38.2C14.5 36.9 15.6 35.8 16.9 35.8H26.5C30.8 35.8 33.2 33.6 35.4 31.5 37.6 29.4 40.3 27.2 45 27.2H47.2C48.5 27.2 49.6 28.3 49.6 29.6 49.6 30.9 48.5 32 47.2 32H45C42.1 32 40.4 33.5 38.3 35.5 36.1 37.6 33 40.6 26.5 40.6H16.9C15.6 40.6 14.5 39.5 14.5 38.2Z"
      />
      {/* Horizon mist bar */}
      <Path
        fill={skyAccent}
        opacity={0.85}
        d="M15 52.8C15 51.5 16.1 50.4 17.4 50.4H37.6C38.9 50.4 40 51.5 40 52.8 40 54.1 38.9 55.2 37.6 55.2H17.4C16.1 55.2 15 54.1 15 52.8ZM44.5 52.8C44.5 51.5 45.6 50.4 46.9 50.4H50.6C51.9 50.4 53 51.5 53 52.8 53 54.1 51.9 55.2 50.6 55.2H46.9C45.6 55.2 44.5 54.1 44.5 52.8Z"
      />
    </Svg>
  )
}
