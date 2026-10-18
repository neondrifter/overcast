import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {
  type MediaOverlayStyle,
  useAutoplayDisabled,
  useHideMediaEnabled,
  useHideProfileMediaEnabled,
  useMediaOverlayStyle,
  useSetAutoplayDisabled,
  useSetHideMediaEnabled,
  useSetHideProfileMediaEnabled,
  useSetMediaOverlayStyle,
} from '#/state/preferences'
import {
  useInAppBrowser,
  useSetInAppBrowser,
} from '#/state/preferences/in-app-browser'
import {
  useTrendingSettings,
  useTrendingSettingsApi,
} from '#/state/preferences/trending'
import {useTrendingConfig} from '#/state/service-config'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Bubbles_Stroke2_Corner2_Rounded as BubblesIcon} from '#/components/icons/Bubble'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon} from '#/components/icons/Eye'
import {Hashtag_Stroke2_Corner0_Rounded as HashtagIcon} from '#/components/icons/Hashtag'
import {Home_Stroke2_Corner2_Rounded as HomeIcon} from '#/components/icons/Home'
import {Macintosh_Stroke2_Corner2_Rounded as MacintoshIcon} from '#/components/icons/Macintosh'
import {Play_Stroke2_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending'
import {UserCircle_Stroke2_Corner0_Rounded as UserCircleIcon} from '#/components/icons/UserCircle'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ContentAndMediaSettings'
>
export function ContentAndMediaSettingsScreen({}: Props) {
  const {t: l} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()
  const autoplayDisabledPref = useAutoplayDisabled()
  const setAutoplayDisabledPref = useSetAutoplayDisabled()
  const hideMediaPref = useHideMediaEnabled()
  const setHideMediaPref = useSetHideMediaEnabled()
  const hideProfileMediaPref = useHideProfileMediaEnabled()
  const setHideProfileMediaPref = useSetHideProfileMediaEnabled()
  const mediaOverlayStyle = useMediaOverlayStyle()
  const setMediaOverlayStyle = useSetMediaOverlayStyle()
  const inAppBrowserPref = useInAppBrowser()
  const setUseInAppBrowser = useSetInAppBrowser()
  const {enabled: trendingEnabled} = useTrendingConfig()
  const {trendingDisabled, trendingVideoDisabled} = useTrendingSettings()
  const {setTrendingDisabled, setTrendingVideoDisabled} =
    useTrendingSettingsApi()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Content & Media</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.LinkItem
            to="/settings/saved-feeds"
            label={l`Manage saved feeds`}>
            <SettingsList.ItemIcon icon={HashtagIcon} />
            <SettingsList.ItemText>
              <Trans>Manage saved feeds</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/threads"
            label={l`Thread preferences`}>
            <SettingsList.ItemIcon icon={BubblesIcon} />
            <SettingsList.ItemText>
              <Trans>Thread preferences</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/following-feed"
            label={l`Following feed preferences`}>
            <SettingsList.ItemIcon icon={HomeIcon} />
            <SettingsList.ItemText>
              <Trans>Following feed preferences</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/external-embeds"
            label={l`External media`}>
            <SettingsList.ItemIcon icon={MacintoshIcon} />
            <SettingsList.ItemText>
              <Trans>External media</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/settings/interests"
            label={l`Your interests`}>
            <SettingsList.ItemIcon icon={CircleInfo} />
            <SettingsList.ItemText>
              <Trans>Your interests</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.Divider />
          {IS_NATIVE && (
            <Toggle.Item
              name="use_in_app_browser"
              label={l`Use in-app browser to open links`}
              value={inAppBrowserPref ?? false}
              onChange={value => setUseInAppBrowser(value)}>
              <SettingsList.Item>
                <SettingsList.ItemIcon icon={WindowIcon} />
                <SettingsList.ItemText>
                  <Trans>Use in-app browser to open links</Trans>
                </SettingsList.ItemText>
                <Toggle.Platform />
              </SettingsList.Item>
            </Toggle.Item>
          )}
          <Toggle.Item
            name="disable_autoplay"
            label={l`Autoplay videos and GIFs`}
            value={!autoplayDisabledPref}
            onChange={value => setAutoplayDisabledPref(!value)}>
            <SettingsList.Item>
              <SettingsList.ItemIcon icon={PlayIcon} />
              <SettingsList.ItemText>
                <Trans>Autoplay videos and GIFs</Trans>
              </SettingsList.ItemText>
              <Toggle.Platform />
            </SettingsList.Item>
          </Toggle.Item>
          <SettingsList.Divider />
          <Toggle.Item
            name="hide_media"
            label={l`Hide media in posts`}
            value={hideMediaPref}
            onChange={value => setHideMediaPref(value)}>
            <SettingsList.Item>
              <SettingsList.ItemIcon icon={EyeSlashIcon} />
              <SettingsList.ItemText>
                <Trans>Hide media in posts</Trans>
              </SettingsList.ItemText>
              <Toggle.Platform />
            </SettingsList.Item>
          </Toggle.Item>
          <Toggle.Item
            name="hide_profile_media"
            label={l`Hide Profile media`}
            value={hideProfileMediaPref}
            onChange={value => setHideProfileMediaPref(value)}>
            <SettingsList.Item>
              <SettingsList.ItemIcon icon={UserCircleIcon} />
              <SettingsList.ItemText>
                <Trans>Hide Profile media</Trans>
              </SettingsList.ItemText>
              <Toggle.Platform />
            </SettingsList.Item>
          </Toggle.Item>
          <SettingsList.Group>
            <SettingsList.ItemIcon icon={SparkleIcon} />
            <SettingsList.ItemText>
              <Trans>Media overlay style</Trans>
            </SettingsList.ItemText>
            <View style={[a.w_full, a.gap_md]}>
              <Text style={[a.flex_1, t.atoms.text_contrast_medium]}>
                <Trans>
                  Choose the overlay used when hiding media in posts:
                </Trans>
              </Text>
              <Toggle.Group
                label={l`Media overlay style`}
                type="radio"
                values={[mediaOverlayStyle]}
                onChange={values => {
                  const next = values[0] as MediaOverlayStyle | undefined
                  if (next) {
                    setMediaOverlayStyle(next)
                  }
                }}>
                <View style={[a.gap_sm, a.flex_1]}>
                  <Toggle.Item name="clouds" label={l`Overcast Clouds`}>
                    <Toggle.Radio />
                    <Toggle.LabelText>
                      <Trans>Overcast Clouds</Trans>
                    </Toggle.LabelText>
                  </Toggle.Item>
                  <Toggle.Item name="autumn" label={l`Autumn Leaves`}>
                    <Toggle.Radio />
                    <Toggle.LabelText>
                      <Trans>Autumn Leaves</Trans>
                    </Toggle.LabelText>
                  </Toggle.Item>
                  <Toggle.Item
                    name="christmas"
                    label={l`Christmas Wrapping Paper`}>
                    <Toggle.Radio />
                    <Toggle.LabelText>
                      <Trans>Christmas Wrapping Paper</Trans>
                    </Toggle.LabelText>
                  </Toggle.Item>
                  <Toggle.Item name="lootbox" label={l`Loot Box`}>
                    <Toggle.Radio />
                    <Toggle.LabelText>
                      <Trans>Loot Box</Trans>
                    </Toggle.LabelText>
                  </Toggle.Item>
                </View>
              </Toggle.Group>
            </View>
          </SettingsList.Group>
          {trendingEnabled ? (
            <>
              <SettingsList.Divider />
              <Toggle.Item
                name="show_trending_topics"
                label={l`Enable trending topics`}
                value={!trendingDisabled}
                onChange={value => {
                  const hide = Boolean(!value)
                  if (hide) {
                    ax.metric('trendingTopics:hide', {context: 'settings'})
                  } else {
                    ax.metric('trendingTopics:show', {context: 'settings'})
                  }
                  setTrendingDisabled(hide)
                }}>
                <SettingsList.Item>
                  <SettingsList.ItemIcon icon={Graph} />
                  <SettingsList.ItemText>
                    <Trans>Enable trending topics</Trans>
                  </SettingsList.ItemText>
                  <Toggle.Platform />
                </SettingsList.Item>
              </Toggle.Item>
              <Toggle.Item
                name="show_trending_videos"
                label={l`Enable trending videos in your Discover feed`}
                value={!trendingVideoDisabled}
                onChange={value => {
                  const hide = Boolean(!value)
                  if (hide) {
                    ax.metric('trendingVideos:hide', {context: 'settings'})
                  } else {
                    ax.metric('trendingVideos:show', {context: 'settings'})
                  }
                  setTrendingVideoDisabled(hide)
                }}>
                <SettingsList.Item>
                  <SettingsList.ItemIcon icon={Graph} />
                  <SettingsList.ItemText>
                    <Trans>Enable trending videos in your Discover feed</Trans>
                  </SettingsList.ItemText>
                  <Toggle.Platform />
                </SettingsList.Item>
              </Toggle.Item>
            </>
          ) : null}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
