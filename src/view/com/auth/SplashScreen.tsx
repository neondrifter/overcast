import {useMemo} from 'react'
import {View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
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
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

/**
 * Full-screen peaceful overcast sky illustration replacing the proprietary
 * Bluesky landing screen artwork.
 */
function OvercastLandingIllustration({isDarkMode}: {isDarkMode: boolean}) {
  const skyTop = isDarkMode ? '#112238' : '#5897D4'
  const skyMid = isDarkMode ? '#1B3350' : '#8FC0EB'
  const skyBottom = isDarkMode ? '#26384D' : '#DCE7F3'
  const backCloud = isDarkMode ? '#213B5A' : '#A7CBEB'
  const midCloud = isDarkMode ? '#2B4666' : '#C5D9EC'
  const frontCloud = isDarkMode ? '#374E68' : '#E3ECF5'
  const mistLine = isDarkMode ? '#6BAEE7' : '#F4F8FC'

  return (
    <View style={[a.absolute, a.inset_0]} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="overcastSplashSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={skyTop} stopOpacity="1" />
            <Stop offset="0.55" stopColor={skyMid} stopOpacity="1" />
            <Stop offset="1" stopColor={skyBottom} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="800" fill="url(#overcastSplashSky)" />

        {/* Soft diffused glow behind the clouds */}
        <Circle
          cx="200"
          cy="250"
          r="110"
          fill={mistLine}
          fillOpacity={isDarkMode ? 0.14 : 0.45}
        />

        {/* Upper distant cloud bank */}
        <Path
          d="M-40 310 C20 265, 95 270, 150 300 C200 250, 285 245, 345 290 C380 275, 415 285, 440 310 L440 800 L-40 800 Z"
          fill={backCloud}
          fillOpacity={0.75}
        />

        {/* Mid-level rolling overcast clouds */}
        <Path
          d="M-30 430 C30 375, 115 380, 175 420 C225 365, 315 365, 370 415 C395 400, 420 410, 435 430 L435 800 L-30 800 Z"
          fill={midCloud}
          fillOpacity={0.85}
        />

        {/* Foreground serene cloud bank */}
        <Path
          d="M-30 555 C35 505, 110 515, 165 550 C220 495, 310 500, 365 545 C395 530, 420 540, 435 555 L435 800 L-30 800 Z"
          fill={frontCloud}
          fillOpacity={0.92}
        />

        {/* Gentle horizontal mist wisps */}
        <Rect
          x="45"
          y="355"
          width="140"
          height="5"
          rx="2.5"
          fill={mistLine}
          fillOpacity={0.35}
        />
        <Rect
          x="215"
          y="480"
          width="135"
          height="5"
          rx="2.5"
          fill={mistLine}
          fillOpacity={0.35}
        />
      </Svg>
    </View>
  )
}

export const SplashScreen = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const t = useTheme()
  const {t: l} = useLingui()
  const isDarkMode = t.name !== 'light'

  const haptics = useHaptics()

  const styles = useMemo(() => {
    const logoFill = isDarkMode ? '#FAFBFC' : t.palette.primary_700
    return {
      logoFill,
      logoShadow: isDarkMode
        ? [
            {
              shadowColor: logoFill,
              shadowRadius: 8,
              shadowOpacity: 0.35,
              shadowOffset: {
                width: 0,
                height: 0,
              },
            },
          ]
        : [],
    }
  }, [t, isDarkMode])

  return (
    <>
      <OvercastLandingIllustration isDarkMode={isDarkMode} />

      <Animated.View
        entering={FadeIn.duration(90)}
        exiting={FadeOut.duration(90)}
        style={[a.flex_1]}>
        <View
          style={[a.justify_center, a.align_center, {gap: 10, paddingTop: 56}]}>
          <Logo width={76} fill={styles.logoFill} style={styles.logoShadow} />
          <Logotype
            width={116}
            fill={styles.logoFill}
            style={styles.logoShadow}
          />
          <Text
            style={[
              a.text_md,
              a.font_semi_bold,
              {
                color: styles.logoFill,
                opacity: 0.85,
              },
            ]}>
            <Trans>An umbrella for your social feed.</Trans>
          </Text>
        </View>

        <View style={[a.flex_1]} />

        <View
          testID="signinOrCreateAccount"
          style={[a.px_5xl, a.gap_md, a.pb_sm]}>
          <Button
            testID="createAccountButton"
            onPress={() => {
              onPressCreateAccount()
              haptics.tap()
            }}
            label={l`Create new account`}
            accessibilityHint={l`Opens flow to create a new Overcast account`}
            size="large"
            color={isDarkMode ? 'secondary_inverted' : 'primary'}
            style={[
              {
                shadowColor: t.palette.black,
                shadowRadius: 8,
                shadowOpacity: 0.1,
                shadowOffset: {
                  width: 0,
                  height: 5,
                },
                elevation: 16,
              },
            ]}>
            <ButtonText>
              <Trans>Create account</Trans>
            </ButtonText>
          </Button>

          <Button
            testID="signInButton"
            onPress={() => {
              onPressSignin()
              haptics.tap()
            }}
            label={l`Sign in`}
            accessibilityHint={l`Opens flow to sign in to your existing account`}
            size="large"
            color="secondary"
            hoverStyle={{opacity: 0.8}}>
            <ButtonText>
              <Trans>Sign in</Trans>
            </ButtonText>
          </Button>
        </View>
      </Animated.View>
    </>
  )
}
