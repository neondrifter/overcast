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
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg'
import {Trans, useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {
  type MediaOverlayStyle,
  useHideMediaEnabled,
  useMediaOverlayStyle,
} from '#/state/preferences'
import {EventStopper} from '#/view/com/util/EventStopper'
import {atoms as a, useTheme, web} from '#/alf'
import {Text} from '#/components/Typography'

export type OvercastMediaKind = 'image' | 'video' | 'gif' | 'thumbnail'

const DISSIPATE_DURATION_MS = 620

/**
 * Wraps post media (images, videos, GIFs, link-card thumbnails) with a themed
 * overlay cover when the global "Hide media in posts" setting is enabled.
 * Supports Overcast Clouds (default), Autumn Leaves, Christmas Wrapping Paper,
 * and Gaming Loot Box overlays with custom reveal animations.
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
  const overlayStyle = useMediaOverlayStyle()
  const t = useTheme()
  const {t: l} = useLingui()
  const haptics = useHaptics()

  const [isRevealed, setIsRevealed] = useState(false)
  const [isOverlayMounted, setIsOverlayMounted] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /*
   * 0 = fully obscured by the selected overlay
   * 1 = overlay has animated out to reveal the media
   */
  const progress = useSharedValue(0)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  // Reset per-post state if the user toggles the global preference or changes overlay style
  useEffect(() => {
    if (hideMediaEnabled) {
      setIsRevealed(false)
      setIsOverlayMounted(true)
      progress.set(0)
    }
  }, [hideMediaEnabled, overlayStyle, progress])

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
        duration: 340,
        easing: Easing.out(Easing.cubic),
      }),
    )

    timerRef.current = setTimeout(() => {
      setIsRevealed(false)
    }, 340)
  }

  const isDark = t.name !== 'light'
  const badgeBgColor = isDark
    ? 'rgba(15, 22, 32, 0.86)'
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

  const actionHint =
    overlayStyle === 'autumn'
      ? l`Blows the autumn leaves away to show the media`
      : overlayStyle === 'christmas'
        ? l`Unwraps the gift paper to show the media`
        : overlayStyle === 'lootbox'
          ? l`Opens the loot box to show the media`
          : l`Clears the overcast clouds to show the media`

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
            accessibilityHint={l`Obscures this media again`}
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
            <OverlaySmallGlyph
              overlayStyle={overlayStyle}
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
            accessibilityHint={actionHint}
            style={[
              a.flex_1,
              a.align_center,
              a.justify_center,
              a.overflow_hidden,
              web({cursor: 'pointer'}),
            ]}>
            {overlayStyle === 'autumn' ? (
              <AutumnLeavesOverlay
                kind={kind}
                progress={progress}
                isDark={isDark}
              />
            ) : overlayStyle === 'christmas' ? (
              <ChristmasWrappingOverlay
                kind={kind}
                progress={progress}
                isDark={isDark}
              />
            ) : overlayStyle === 'lootbox' ? (
              <LootBoxOverlay kind={kind} progress={progress} isDark={isDark} />
            ) : (
              <OvercastCloudsOverlay
                kind={kind}
                progress={progress}
                isDark={isDark}
              />
            )}
          </Pressable>
        </EventStopper>
      )}
    </View>
  )
}

function HiddenMediaTitle({
  kind,
  color,
}: {
  kind: OvercastMediaKind
  color: string
}) {
  return (
    <Text style={[a.text_sm, a.font_semi_bold, a.text_center, {color}]}>
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
  )
}

/**
 * 1. Overcast Clouds (Default)
 * Rolling overcast clouds that part left and right when tapped.
 */
function OvercastCloudsOverlay({
  kind,
  progress,
  isDark,
}: {
  kind: OvercastMediaKind
  progress: SharedValue<number>
  isDark: boolean
}) {
  const t = useTheme()
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

  return (
    <>
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
            <LinearGradient id="overcastMediaSky" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={skyTopColor} stopOpacity="1" />
              <Stop offset="1" stopColor={skyBottomColor} stopOpacity="1" />
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
        <HiddenMediaTitle kind={kind} color={t.atoms.text.color} />
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
    </>
  )
}

/**
 * 2. Autumn Leaves
 * A warm bed of maple, oak, and birch leaves in crimson, amber, burnt orange,
 * and gold. When tapped, a brisk autumn gust blows the leaves away in swirling
 * trajectories across the screen.
 */
function AutumnLeavesOverlay({
  kind,
  progress,
  isDark,
}: {
  kind: OvercastMediaKind
  progress: SharedValue<number>
  isDark: boolean
}) {
  const bgTop = isDark ? '#2A160D' : '#F6DEC3'
  const bgBottom = isDark ? '#3D2012' : '#FCECD8'
  const sunGlow = isDark ? '#D96B27' : '#F7B24B'
  const crimson = isDark ? '#A83228' : '#C93B2B'
  const burntOrange = isDark ? '#C85A17' : '#E0671F'
  const amberGold = isDark ? '#D98A1C' : '#F09D26'
  const russet = isDark ? '#7A2E1D' : '#9E3E26'
  const badgeBg = isDark
    ? 'rgba(34, 18, 11, 0.88)'
    : 'rgba(255, 248, 240, 0.94)'
  const badgeBorder = isDark
    ? 'rgba(224, 103, 31, 0.45)'
    : 'rgba(201, 59, 43, 0.3)'
  const titleColor = isDark ? '#FDEBD6' : '#3E1C0E'
  const subtitleColor = isDark ? '#F59E3F' : '#C44D16'

  const backdropStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.15),
    }
  })

  // Upper-left leaf cluster blows up-right and tumbles
  const topLeftClusterStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.1),
      transform: [
        {translateX: 165 * p},
        {translateY: -75 * p},
        {rotate: `${38 * p}deg`},
        {scale: 1 + 0.12 * p},
      ],
    }
  })

  // Upper-right leaf cluster blows far right and spins
  const topRightClusterStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.05),
      transform: [
        {translateX: 210 * p},
        {translateY: -45 * p},
        {rotate: `${55 * p}deg`},
        {scale: 1 + 0.15 * p},
      ],
    }
  })

  // Lower-left leaf drift blows diagonally across the frame
  const bottomLeftClusterStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.05),
      transform: [
        {translateX: 195 * p},
        {translateY: -95 * p},
        {rotate: `${-45 * p}deg`},
        {scale: 1 + 0.1 * p},
      ],
    }
  })

  // Lower-right leaf drift blows off the bottom-right corner
  const bottomRightClusterStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.05),
      transform: [
        {translateX: 230 * p},
        {translateY: 50 * p},
        {rotate: `${65 * p}deg`},
        {scale: 1 + 0.18 * p},
      ],
    }
  })

  // Swirling wind gust streaks that sweep across during the reveal
  const windGustStyle = useAnimatedStyle(() => {
    const p = progress.get()
    const gustOpacity = p < 0.05 ? 0 : Math.max(0, Math.sin(p * Math.PI) * 0.9)
    return {
      opacity: gustOpacity,
      transform: [{translateX: -120 + 260 * p}],
    }
  })

  const centerPromptStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.65),
      transform: [
        {translateX: 60 * p},
        {translateY: -18 * p},
        {rotate: `${12 * p}deg`},
        {scale: 1 - 0.1 * p},
      ],
    }
  })

  return (
    <>
      <Animated.View
        style={[
          a.absolute,
          a.inset_0,
          {backgroundColor: bgBottom},
          backdropStyle,
        ]}>
        <Svg
          viewBox="0 0 400 240"
          width="100%"
          height="100%"
          preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="autumnSkyGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={bgTop} stopOpacity="1" />
              <Stop offset="1" stopColor={bgBottom} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="240" fill="url(#autumnSkyGrad)" />
          <Circle
            cx="110"
            cy="65"
            r="90"
            fill={sunGlow}
            fillOpacity={isDark ? 0.2 : 0.35}
          />
        </Svg>
      </Animated.View>

      {/* Upper-left canopy of autumn foliage */}
      <Animated.View
        style={[
          a.absolute,
          {top: -20, left: -25, width: '74%', height: 150},
          topLeftClusterStyle,
        ]}>
        <Svg
          viewBox="0 0 300 150"
          width="100%"
          height="100%"
          preserveAspectRatio="none">
          <Path
            fill={russet}
            d="M0 0h280c-12 35-48 58-88 52-24 28-68 38-106 20C54 96 22 98 0 82V0Z"
          />
          <Path
            fill={crimson}
            d="M15 12C45 4 78 18 92 44c26-14 58-6 74 18 22-8 48 6 54 28-24 18-58 16-82-4-24 18-62 16-86-6C28 88 6 74 0 50V18l15-6Z"
          />
          {/* Stylized maple & oak leaves */}
          <Path
            fill={amberGold}
            d="M70 28 L82 14 L86 26 L102 22 L92 36 L104 44 L86 48 L82 62 L72 48 L56 46 L68 36 Z"
          />
          <Path
            fill={burntOrange}
            d="M165 22 C182 12, 204 20, 208 38 C192 50, 170 46, 165 22 Z"
          />
        </Svg>
      </Animated.View>

      {/* Upper-right canopy of autumn foliage */}
      <Animated.View
        style={[
          a.absolute,
          {top: -18, right: -25, width: '74%', height: 150},
          topRightClusterStyle,
        ]}>
        <Svg
          viewBox="0 0 300 150"
          width="100%"
          height="100%"
          preserveAspectRatio="none">
          <Path
            fill={burntOrange}
            d="M300 0H20c14 34 50 54 90 48 26 28 70 36 108 18 32 22 62 24 82 10V0Z"
          />
          <Path
            fill={amberGold}
            opacity={0.9}
            d="M285 16c-32-8-66 6-82 32-24-14-56-6-72 18-20-6-44 8-50 28 24 16 58 14 82-6 26 16 62 14 86-8 22 8 44-4 51-26V22l-15-6Z"
          />
          <Path
            fill={crimson}
            d="M210 34 L222 18 L228 32 L244 28 L234 42 L246 52 L228 54 L222 68 L212 54 L196 52 L208 42 Z"
          />
        </Svg>
      </Animated.View>

      {/* Lower-left autumn leaf pile */}
      <Animated.View
        style={[
          a.absolute,
          {bottom: -22, left: -28, width: '78%', height: 155},
          bottomLeftClusterStyle,
        ]}>
        <Svg
          viewBox="0 0 320 155"
          width="100%"
          height="100%"
          preserveAspectRatio="none">
          <Path
            fill={burntOrange}
            d="M0 155h310v-42c-24-24-62-34-100-24-28-28-76-36-116-18C62 52 24 56 0 76v79Z"
          />
          <Path
            fill={amberGold}
            opacity={0.92}
            d="M-10 155h270c14-22-2-50-30-54-18-24-54-30-82-14-26-22-68-22-94 0-22-10-52 0-64 22v46Z"
          />
          <Path
            fill={crimson}
            d="M95 96 L108 80 L114 94 L130 90 L120 104 L132 114 L114 116 L108 130 L98 116 L82 114 L94 104 Z"
          />
        </Svg>
      </Animated.View>

      {/* Lower-right autumn leaf pile */}
      <Animated.View
        style={[
          a.absolute,
          {bottom: -22, right: -28, width: '78%', height: 155},
          bottomRightClusterStyle,
        ]}>
        <Svg
          viewBox="0 0 320 155"
          width="100%"
          height="100%"
          preserveAspectRatio="none">
          <Path
            fill={crimson}
            d="M320 155H10v-40c24-22 62-32 100-22 28-28 76-36 116-18 32-18 70-14 94 6v74Z"
          />
          <Path
            fill={burntOrange}
            opacity={0.92}
            d="M330 155H50c-14-20 2-48 30-52 18-24 54-30 82-14 26-22 68-22 94 0 24-10 58 0 74 22v44Z"
          />
          <Path
            fill={amberGold}
            d="M215 92 L228 76 L234 90 L250 86 L240 100 L252 110 L234 112 L228 126 L218 112 L202 110 L214 100 Z"
          />
        </Svg>
      </Animated.View>

      {/* Swirling wind gust lines */}
      <Animated.View
        pointerEvents="none"
        style={[a.absolute, a.inset_0, windGustStyle]}>
        <Svg viewBox="0 0 400 240" width="100%" height="100%" fill="none">
          <Path
            d="M20 85 C110 65, 220 95, 340 55"
            stroke={amberGold}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />
          <Path
            d="M50 155 C150 135, 260 165, 380 120"
            stroke={burntOrange}
            strokeWidth="3"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
        </Svg>
      </Animated.View>

      {/* Center prompt badge */}
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
            backgroundColor: badgeBg,
            borderColor: badgeBorder,
          },
          centerPromptStyle,
        ]}>
        <AutumnLeafGlyph size={34} color={crimson} accentColor={amberGold} />
        <HiddenMediaTitle kind={kind} color={titleColor} />
        <Text
          style={[
            a.text_xs,
            a.font_medium,
            a.text_center,
            {color: subtitleColor},
          ]}>
          <Trans>Tap to blow the leaves away</Trans>
        </Text>
      </Animated.View>
    </>
  )
}

/**
 * 3. Christmas Wrapping Paper
 * Festive wrapping paper with diagonal stripes, gold satin cross-ribbons, and
 * a center gift bow. When tapped, the bow unties and the left/right wrapping
 * paper panels tear and peel open from the center seam.
 */
function ChristmasWrappingOverlay({
  kind,
  progress,
  isDark,
}: {
  kind: OvercastMediaKind
  progress: SharedValue<number>
  isDark: boolean
}) {
  const paperRed = isDark ? '#7F1D1D' : '#C82829'
  const paperStripe = isDark ? '#991B1B' : '#DC393A'
  const pineTrim = isDark ? '#14532D' : '#1E6F40'
  const goldRibbon = isDark ? '#F59E0B' : '#FBBF24'
  const goldHighlight = '#FDE68A'
  const tagBg = isDark ? 'rgba(28, 12, 12, 0.92)' : 'rgba(255, 251, 242, 0.96)'
  const tagBorder = goldRibbon
  const titleColor = isDark ? '#FEF3C7' : '#451A03'
  const subtitleColor = isDark ? '#FBBF24' : '#B45309'

  // Left half of wrapping paper unwraps to the left
  const leftPaperStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.05),
      transform: [
        {translateX: -220 * p},
        {rotate: `${-8 * p}deg`},
        {scaleX: 1 - 0.15 * p},
      ],
    }
  })

  // Right half of wrapping paper unwraps to the right
  const rightPaperStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.05),
      transform: [
        {translateX: 220 * p},
        {rotate: `${8 * p}deg`},
        {scaleX: 1 - 0.15 * p},
      ],
    }
  })

  // Center bow & gift tag pop up and untie
  const bowTagStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.5),
      transform: [
        {translateY: -45 * p},
        {scale: 1 + 0.18 * Math.sin(p * Math.PI) - 0.3 * p},
        {rotate: `${-10 * p}deg`},
      ],
    }
  })

  return (
    <>
      {/* Left Wrapping Paper Panel */}
      <Animated.View
        style={[
          a.absolute,
          {top: 0, bottom: 0, left: 0, width: '51%'},
          leftPaperStyle,
        ]}>
        <Svg
          viewBox="0 0 200 240"
          width="100%"
          height="100%"
          preserveAspectRatio="none">
          <Rect width="200" height="240" fill={paperRed} />
          {/* Festive diagonal candy stripes */}
          <Path
            fill={paperStripe}
            d="M0 0 L45 0 L0 45 Z M80 0 L125 0 L0 125 L0 80 Z M160 0 L200 0 L200 5 L0 205 L0 160 Z M200 85 L200 130 L90 240 L45 240 Z M200 165 L200 210 L170 240 L125 240 Z"
          />
          {/* Decorative pine-green border accent */}
          <Rect x="0" y="0" width="12" height="240" fill={pineTrim} />
          {/* Gold snowflakes/stars pattern */}
          <Circle cx="55" cy="55" r="3.5" fill={goldHighlight} opacity="0.55" />
          <Circle cx="135" cy="65" r="3" fill={goldHighlight} opacity="0.55" />
          <Circle
            cx="65"
            cy="185"
            r="3.5"
            fill={goldHighlight}
            opacity="0.55"
          />
          <Circle cx="145" cy="175" r="3" fill={goldHighlight} opacity="0.55" />
          {/* Horizontal Gold Ribbon (left half) */}
          <Rect x="0" y="106" width="200" height="28" fill={goldRibbon} />
          <Rect
            x="0"
            y="111"
            width="200"
            height="4"
            fill={goldHighlight}
            opacity="0.7"
          />
          {/* Vertical Gold Ribbon (left edge of center seam) */}
          <Rect x="184" y="0" width="16" height="240" fill={goldRibbon} />
          <Rect
            x="188"
            y="0"
            width="3"
            height="240"
            fill={goldHighlight}
            opacity="0.7"
          />
        </Svg>
      </Animated.View>

      {/* Right Wrapping Paper Panel */}
      <Animated.View
        style={[
          a.absolute,
          {top: 0, bottom: 0, right: 0, width: '51%'},
          rightPaperStyle,
        ]}>
        <Svg
          viewBox="0 0 200 240"
          width="100%"
          height="100%"
          preserveAspectRatio="none">
          <Rect width="200" height="240" fill={paperRed} />
          {/* Festive diagonal candy stripes */}
          <Path
            fill={paperStripe}
            d="M40 0 L85 0 L0 85 L0 40 Z M120 0 L165 0 L0 165 L0 120 Z M200 0 L200 45 L5 240 L0 240 L0 200 Z M200 85 L200 130 L90 240 L45 240 Z M200 165 L200 210 L170 240 L125 240 Z"
          />
          {/* Decorative pine-green border accent */}
          <Rect x="188" y="0" width="12" height="240" fill={pineTrim} />
          {/* Gold snowflakes/stars pattern */}
          <Circle cx="65" cy="60" r="3" fill={goldHighlight} opacity="0.55" />
          <Circle
            cx="145"
            cy="55"
            r="3.5"
            fill={goldHighlight}
            opacity="0.55"
          />
          <Circle cx="55" cy="180" r="3" fill={goldHighlight} opacity="0.55" />
          <Circle
            cx="135"
            cy="185"
            r="3.5"
            fill={goldHighlight}
            opacity="0.55"
          />
          {/* Horizontal Gold Ribbon (right half) */}
          <Rect x="0" y="106" width="200" height="28" fill={goldRibbon} />
          <Rect
            x="0"
            y="111"
            width="200"
            height="4"
            fill={goldHighlight}
            opacity="0.7"
          />
          {/* Vertical Gold Ribbon (right edge of center seam) */}
          <Rect x="0" y="0" width="16" height="240" fill={goldRibbon} />
          <Rect
            x="9"
            y="0"
            width="3"
            height="240"
            fill={goldHighlight}
            opacity="0.7"
          />
        </Svg>
      </Animated.View>

      {/* Center Gift Bow & Gift Tag Prompt */}
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
            backgroundColor: tagBg,
            borderColor: tagBorder,
            borderWidth: 2,
          },
          bowTagStyle,
        ]}>
        <ChristmasGiftGlyph
          size={36}
          color={paperRed}
          accentColor={goldRibbon}
        />
        <HiddenMediaTitle kind={kind} color={titleColor} />
        <Text
          style={[
            a.text_xs,
            a.font_semi_bold,
            a.text_center,
            {color: subtitleColor},
          ]}>
          <Trans>Tap to unwrap gift</Trans>
        </Text>
      </Animated.View>
    </>
  )
}

/**
 * 4. Gaming Loot Box
 * A flashy, high-rarity gaming loot crate with glowing neon purple/cyan/gold
 * trim, metallic armor plates, and a legendary core crystal. When tapped,
 * the top lid and bottom base blast apart with a blinding golden/cyan energy
 * burst and radiating sunbeams to reveal the media.
 */
function LootBoxOverlay({
  kind,
  progress,
  isDark,
}: {
  kind: OvercastMediaKind
  progress: SharedValue<number>
  isDark: boolean
}) {
  const crateMetalDark = '#131124'
  const crateMetalMid = '#221E3D'
  const crateArmorTrim = '#393266'
  const legendaryGold = '#FACC15'
  const neonCyan = '#22D3EE'
  const neonMagenta = '#C084FC'
  const badgeBg = isDark ? 'rgba(14, 11, 28, 0.92)' : 'rgba(20, 16, 40, 0.92)'

  // Upper crate lid blasts upward when tapped
  const topCrateLidStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.1),
      transform: [{translateY: -185 * p}, {scale: 1 + 0.08 * p}],
    }
  })

  // Lower crate base blasts downward when tapped
  const bottomCrateBaseStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.1),
      transform: [{translateY: 185 * p}, {scale: 1 + 0.08 * p}],
    }
  })

  // Flashy golden/cyan loot-drop explosion burst in the middle of the reveal
  const lootFlashBurstStyle = useAnimatedStyle(() => {
    const p = progress.get()
    const flashOpacity =
      p < 0.02 ? 0 : p < 0.35 ? (p / 0.35) * 0.95 : Math.max(0, (1 - p) * 1.45)
    return {
      opacity: flashOpacity,
      transform: [{scale: 0.5 + 1.8 * p}, {rotate: `${45 * p}deg`}],
    }
  })

  // Center holographic lock badge scales up then shatters/fades
  const centerCoreStyle = useAnimatedStyle(() => {
    const p = progress.get()
    return {
      opacity: Math.max(0, 1 - p * 1.8),
      transform: [{scale: 1 + 0.35 * p}],
    }
  })

  return (
    <>
      {/* Upper Loot Crate Lid */}
      <Animated.View
        style={[
          a.absolute,
          {top: 0, left: 0, right: 0, height: '52%'},
          topCrateLidStyle,
        ]}>
        <Svg
          viewBox="0 0 400 125"
          width="100%"
          height="100%"
          preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="lootTopGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={crateMetalDark} stopOpacity="1" />
              <Stop offset="1" stopColor={crateMetalMid} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="125" fill="url(#lootTopGrad)" />
          {/* Angled sci-fi armor plates */}
          <Polygon
            points="0,0 95,0 65,125 0,125"
            fill={crateArmorTrim}
            opacity="0.55"
          />
          <Polygon
            points="400,0 305,0 335,125 400,125"
            fill={crateArmorTrim}
            opacity="0.55"
          />
          {/* Golden legendary corner brackets */}
          <Path
            d="M0 0 H55 L42 14 H14 V42 L0 55 Z M400 0 H345 L358 14 H386 V42 L400 55 Z"
            fill={legendaryGold}
          />
          {/* Glowing neon energy seam along the bottom edge of the top lid */}
          <Rect x="0" y="115" width="400" height="6" fill={legendaryGold} />
          <Rect
            x="40"
            y="111"
            width="320"
            height="4"
            fill={neonCyan}
            opacity="0.85"
          />
        </Svg>
      </Animated.View>

      {/* Lower Loot Crate Base */}
      <Animated.View
        style={[
          a.absolute,
          {bottom: 0, left: 0, right: 0, height: '52%'},
          bottomCrateBaseStyle,
        ]}>
        <Svg
          viewBox="0 0 400 125"
          width="100%"
          height="100%"
          preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="lootBottomGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={crateMetalMid} stopOpacity="1" />
              <Stop offset="1" stopColor={crateMetalDark} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="125" fill="url(#lootBottomGrad)" />
          {/* Angled sci-fi armor plates */}
          <Polygon
            points="0,0 65,0 95,125 0,125"
            fill={crateArmorTrim}
            opacity="0.55"
          />
          <Polygon
            points="400,0 335,0 305,125 400,125"
            fill={crateArmorTrim}
            opacity="0.55"
          />
          {/* Golden legendary corner brackets */}
          <Path
            d="M0 125 H55 L42 111 H14 V83 L0 70 Z M400 125 H345 L358 111 H386 V83 L400 70 Z"
            fill={legendaryGold}
          />
          {/* Glowing neon energy seam along the top edge of the lower base */}
          <Rect x="0" y="4" width="400" height="6" fill={legendaryGold} />
          <Rect
            x="40"
            y="10"
            width="320"
            height="4"
            fill={neonCyan}
            opacity="0.85"
          />
        </Svg>
      </Animated.View>

      {/* Flashy Loot Box Reveal Burst (radiating golden/cyan rays & sparkles) */}
      <Animated.View
        pointerEvents="none"
        style={[
          a.absolute,
          a.inset_0,
          a.align_center,
          a.justify_center,
          lootFlashBurstStyle,
        ]}>
        <Svg viewBox="0 0 240 240" width={260} height={260}>
          <Circle
            cx="120"
            cy="120"
            r="88"
            fill={legendaryGold}
            fillOpacity="0.35"
          />
          <Circle cx="120" cy="120" r="58" fill={neonCyan} fillOpacity="0.45" />
          {/* 8-point flashy star rays */}
          <Path
            fill={legendaryGold}
            d="M120 4 L134 92 L220 65 L146 116 L236 120 L146 124 L220 175 L134 148 L120 236 L106 148 L20 175 L94 124 L4 120 L94 116 L20 65 L106 92 Z"
          />
          <Circle cx="120" cy="120" r="34" fill="#FFFFFF" />
        </Svg>
      </Animated.View>

      {/* Center Legendary Core Badge */}
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
            backgroundColor: badgeBg,
            borderColor: legendaryGold,
            borderWidth: 2,
          },
          centerCoreStyle,
        ]}>
        <LootBoxGlyph
          size={36}
          color={legendaryGold}
          accentColor={neonCyan}
          gemColor={neonMagenta}
        />
        <HiddenMediaTitle kind={kind} color="#FFFFFF" />
        <Text
          style={[
            a.text_xs,
            a.font_bold,
            a.text_center,
            {color: legendaryGold},
          ]}>
          <Trans>Tap to open Loot Box</Trans>
        </Text>
      </Animated.View>
    </>
  )
}

function OverlaySmallGlyph({
  overlayStyle,
  color,
  accentColor,
}: {
  overlayStyle: MediaOverlayStyle
  color: string
  accentColor: string
}) {
  if (overlayStyle === 'autumn') {
    return <AutumnLeafGlyph size={14} color="#C93B2B" accentColor="#F09D26" />
  }
  if (overlayStyle === 'christmas') {
    return (
      <ChristmasGiftGlyph size={14} color="#C82829" accentColor="#F59E0B" />
    )
  }
  if (overlayStyle === 'lootbox') {
    return (
      <LootBoxGlyph
        size={14}
        color="#FACC15"
        accentColor="#22D3EE"
        gemColor="#C084FC"
      />
    )
  }
  return <OvercastGlyph size={14} color={color} accentColor={accentColor} />
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
    <Svg viewBox="0 0 64 57" width={size} height={(size * 57) / 64} fill="none">
      {/* Upper-right sky-blue rain-crest & ferrule */}
      <Path
        fill={skyAccent}
        d="M32 1.2C33.2 1.2 34.2 2.2 34.2 3.4V5.2H29.8V3.4C29.8 2.2 30.8 1.2 32 1.2ZM36.2 6.2C47.8 7.5 57.5 14.9 61.2 25.4C58.1 23.3 53.9 23.0 50.4 24.8C46.2 15.8 41.5 9.6 36.2 6.2Z"
      />
      {/* Sculpted umbrella canopy with negative-space S-curve rib channel */}
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32 6.8C48.8 6.8 62 19.6 62 34.8C62 35.8 61.0 36.5 60.1 36.0C57.6 34.2 54.6 33.4 51.8 33.4C49.0 33.4 46.2 34.3 43.8 36.0C43.1 36.5 42.1 36.5 41.4 36.0C38.8 34.2 35.4 33.4 32 33.4C28.6 33.4 25.2 34.2 22.6 36.0C21.9 36.5 20.9 36.5 20.2 36.0C17.8 34.3 15.0 33.4 12.2 33.4C9.4 33.4 6.4 34.2 3.9 36.0C3.0 36.5 2 35.8 2 34.8C2 19.6 15.2 6.8 32 6.8ZM13.5 25.2C18.8 25.2 23.2 21.4 29.5 21.4C35.8 21.4 40.2 25.2 46.5 25.2H51.2C52.2 25.2 53.0 26.0 53.0 27.0C53.0 28.0 52.2 28.8 51.2 28.8H46.5C39.2 28.8 34.8 25.0 29.5 25.0C24.2 25.0 19.8 28.8 13.5 28.8C12.5 28.8 11.7 28.0 11.7 27.0C11.7 26.0 12.5 25.2 13.5 25.2Z"
      />
      {/* Sculpted J-hook umbrella handle & mist droplet accent */}
      <Path
        fill={skyAccent}
        opacity={0.9}
        d="M29.8 33.2H34.2V46.2C34.2 51.5 29.9 55.5 24.6 55.5C19.3 55.5 15.2 51.5 15.2 46.4C15.2 45.2 16.2 44.2 17.4 44.2C18.6 44.2 19.6 45.2 19.6 46.4C19.6 49.1 21.8 51.1 24.6 51.1C27.4 51.1 29.8 49.1 29.8 46.2V33.2ZM41.5 48.2H49.5C50.7 48.2 51.7 49.2 51.7 50.4C51.7 51.6 50.7 52.6 49.5 52.6H41.5C40.3 52.6 39.3 51.6 39.3 50.4C39.3 49.2 40.3 48.2 41.5 48.2Z"
      />
    </Svg>
  )
}

function AutumnLeafGlyph({
  size = 28,
  color,
  accentColor,
}: {
  size?: number
  color: string
  accentColor: string
}) {
  return (
    <Svg viewBox="0 0 64 57" width={size} height={(size * 57) / 64} fill="none">
      {/* Secondary golden leaf drifting behind */}
      <Path
        fill={accentColor}
        d="M38 8 C49 6, 58 14, 58 26 C46 32, 36 24, 38 8 Z"
      />
      {/* Sculpted crimson maple leaf */}
      <Path
        fill={color}
        d="M30 4 L36 18 L50 12 L42 26 L56 32 L40 38 L44 48 L30 42 L28 55 L24 55 L26 42 L12 48 L16 38 L4 32 L18 26 L10 12 L24 18 Z"
      />
    </Svg>
  )
}

function ChristmasGiftGlyph({
  size = 28,
  color,
  accentColor,
}: {
  size?: number
  color: string
  accentColor: string
}) {
  return (
    <Svg viewBox="0 0 64 57" width={size} height={(size * 57) / 64} fill="none">
      {/* Gift box body */}
      <Rect x="10" y="22" width="44" height="32" rx="4" fill={color} />
      {/* Gift box lid */}
      <Rect x="6" y="14" width="52" height="10" rx="3" fill={color} />
      {/* Vertical & horizontal gold ribbon */}
      <Rect x="28" y="14" width="8" height="40" fill={accentColor} />
      <Rect x="10" y="34" width="44" height="7" fill={accentColor} />
      {/* Festive ribbon bow loops */}
      <Path
        fill={accentColor}
        d="M32 14 C22 14, 14 7, 20 3 C25 0, 31 6, 32 14 Z M32 14 C42 14, 50 7, 44 3 C39 0, 33 6, 32 14 Z"
      />
    </Svg>
  )
}

function LootBoxGlyph({
  size = 28,
  color,
  accentColor,
  gemColor,
}: {
  size?: number
  color: string
  accentColor: string
  gemColor: string
}) {
  return (
    <Svg viewBox="0 0 64 57" width={size} height={(size * 57) / 64} fill="none">
      {/* Hexagonal treasure chest body */}
      <Polygon
        points="12,18 52,18 58,32 50,52 14,52 6,32"
        fill="#221E3D"
        stroke={color}
        strokeWidth="3.5"
      />
      {/* Glowing neon seam */}
      <Rect x="8" y="30" width="48" height="4" fill={accentColor} />
      {/* Center legendary diamond core */}
      <G>
        <Polygon
          points="32,19 41,32 32,45 23,32"
          fill={gemColor}
          stroke={color}
          strokeWidth="2.5"
        />
        <Polygon points="32,23 37,32 32,41 27,32" fill={accentColor} />
      </G>
    </Svg>
  )
}
