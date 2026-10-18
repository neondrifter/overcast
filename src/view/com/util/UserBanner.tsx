import {useCallback, useState} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg'
import {Image} from 'expo-image'
import {type ModerationUI} from '@bsky/sdk/moderation'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {IMAGE_SIZE_CONFIG_2K_1MB} from '#/lib/constants'
import {
  useCameraPermission,
  usePhotoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import {compressIfNeeded} from '#/lib/media/manip'
import {openCamera, openCropper, openPicker} from '#/lib/media/picker'
import {type PickerImage} from '#/lib/media/picker.shared'
import {isCancelledError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {
  type ComposerImage,
  compressImage,
  createComposerImage,
} from '#/state/gallery'
import {useHideProfileMediaEnabled} from '#/state/preferences'
import {EditImageDialog} from '#/view/com/composer/photos/EditImageDialog'
import {EventStopper} from '#/view/com/util/EventStopper'
import {atoms as a, tokens, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {
  Camera_Filled_Stroke2_Corner0_Rounded as CameraFilledIcon,
  Camera_Stroke2_Corner0_Rounded as CameraIcon,
} from '#/components/icons/Camera'
import {StreamingLive_Stroke2_Corner0_Rounded as LibraryIcon} from '#/components/icons/StreamingLive'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Menu from '#/components/Menu'
import {IS_ANDROID, IS_NATIVE} from '#/env'

export function UserBanner({
  type,
  banner,
  moderation,
  onSelectNewBanner,
}: {
  type?: 'labeler' | 'default'
  banner?: string | null
  moderation?: ModerationUI
  onSelectNewBanner?: (img: PickerImage | null) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const hideProfileMedia = useHideProfileMediaEnabled()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const sheetWrapper = useSheetWrapper()
  const [rawImage, setRawImage] = useState<ComposerImage | undefined>()
  const editImageDialogControl = useDialogControl()

  const onOpenCamera = useCallback(async () => {
    if (!(await requestCameraAccessIfNeeded())) {
      return
    }
    const image = await openCamera({
      aspect: [3, 1],
    })
    if (!image) {
      return
    }

    onSelectNewBanner?.(await compressIfNeeded(image, IMAGE_SIZE_CONFIG_2K_1MB))
  }, [onSelectNewBanner, requestCameraAccessIfNeeded])

  const onOpenLibrary = useCallback(async () => {
    if (!(await requestPhotoAccessIfNeeded())) {
      return
    }
    const items = await sheetWrapper(openPicker())
    if (!items[0]) {
      return
    }

    try {
      if (IS_NATIVE) {
        /*
         * Nested rather than `?.()`: React Compiler cannot lower an optional
         * call inside a `try`. Like `?.()`, this leaves the arguments
         * unevaluated when the callback is absent.
         */
        if (onSelectNewBanner) {
          onSelectNewBanner(
            await compressIfNeeded(
              await openCropper({
                imageUri: items[0].path,
                aspectRatio: 3 / 1,
              }),
              IMAGE_SIZE_CONFIG_2K_1MB,
            ),
          )
        }
      } else {
        setRawImage(await createComposerImage(items[0]))
        editImageDialogControl.open()
      }
    } catch (e) {
      // Don't log errors for cancelling selection to sentry on ios or android
      if (!isCancelledError(e)) {
        logger.error('Failed to crop banner', {error: e})
      }
    }
  }, [
    onSelectNewBanner,
    requestPhotoAccessIfNeeded,
    sheetWrapper,
    editImageDialogControl,
  ])

  const onRemoveBanner = useCallback(() => {
    onSelectNewBanner?.(null)
  }, [onSelectNewBanner])

  const onChangeEditImage = useCallback(
    async (image: ComposerImage) => {
      const compressed = await compressImage(image, IMAGE_SIZE_CONFIG_2K_1MB)
      onSelectNewBanner?.(compressed)
    },
    [onSelectNewBanner],
  )

  // setUserBanner is only passed as prop on the EditProfile component
  return onSelectNewBanner ? (
    <>
      <EventStopper onKeyDown={true}>
        <Menu.Root>
          <Menu.Trigger label={_(msg`Edit avatar`)}>
            {({props}) => (
              <Pressable {...props} testID="changeBannerBtn">
                {banner ? (
                  <Image
                    testID="userBannerImage"
                    style={styles.bannerImage}
                    source={{uri: banner}}
                    accessible={true}
                    accessibilityIgnoresInvertColors
                    useAppleWebpCodec
                  />
                ) : (
                  <View
                    testID="userBannerFallback"
                    style={[styles.bannerImage, t.atoms.bg_contrast_25]}
                  />
                )}
                <View
                  style={[
                    styles.editButtonContainer,
                    t.atoms.bg_contrast_25,
                    a.border,
                    t.atoms.border_contrast_low,
                  ]}>
                  <CameraFilledIcon
                    height={14}
                    width={14}
                    style={t.atoms.text}
                  />
                </View>
              </Pressable>
            )}
          </Menu.Trigger>
          <Menu.Outer showCancel>
            <Menu.Group>
              {IS_NATIVE && (
                <Menu.Item
                  testID="changeBannerCameraBtn"
                  label={_(msg`Upload from Camera`)}
                  onPress={onOpenCamera}>
                  <Menu.ItemText>
                    <Trans>Upload from Camera</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={CameraIcon} />
                </Menu.Item>
              )}

              <Menu.Item
                testID="changeBannerLibraryBtn"
                label={_(msg`Upload from Library`)}
                onPress={onOpenLibrary}>
                <Menu.ItemText>
                  {IS_NATIVE ? (
                    <Trans>Upload from Library</Trans>
                  ) : (
                    <Trans>Upload from Files</Trans>
                  )}
                </Menu.ItemText>
                <Menu.ItemIcon icon={LibraryIcon} />
              </Menu.Item>
            </Menu.Group>
            {!!banner && (
              <>
                <Menu.Divider />
                <Menu.Group>
                  <Menu.Item
                    testID="changeBannerRemoveBtn"
                    label={_(msg`Remove Banner`)}
                    onPress={onRemoveBanner}>
                    <Menu.ItemText>
                      <Trans>Remove Banner</Trans>
                    </Menu.ItemText>
                    <Menu.ItemIcon icon={TrashIcon} />
                  </Menu.Item>
                </Menu.Group>
              </>
            )}
          </Menu.Outer>
        </Menu.Root>
      </EventStopper>

      <EditImageDialog
        control={editImageDialogControl}
        image={rawImage}
        onChange={onChangeEditImage}
        aspectRatio={3}
      />
    </>
  ) : hideProfileMedia ? (
    <OvercastBanner />
  ) : banner &&
    !(moderation?.blur && IS_ANDROID /* android crashes with blur */) ? (
    <Image
      style={[styles.bannerImage, t.atoms.bg_contrast_25]}
      contentFit="cover"
      source={{uri: banner}}
      blurRadius={moderation?.blur ? 100 : 0}
      accessible={true}
      accessibilityIgnoresInvertColors
      useAppleWebpCodec
    />
  ) : (
    <View
      style={[
        styles.bannerImage,
        type === 'labeler' ? styles.labelerBanner : t.atoms.bg_contrast_25,
      ]}
    />
  )
}

function OvercastBanner() {
  const t = useTheme()
  const isDark = t.name !== 'light'
  const skyTopColor = isDark ? '#142942' : '#7DB5E8'
  const skyBottomColor = isDark ? '#1E344D' : '#D6E6F5'
  const sunbreakColor = isDark ? '#3B82CE' : '#B8DDFB'
  const upperCloudColor = isDark ? '#1B3A5C' : '#95C1EA'
  const midCloudColor = isDark ? '#27476B' : '#BFD6EC'
  const lowerCloudColor = isDark ? t.palette.contrast_200 : '#DCE6F2'
  const frontMistColor = isDark ? t.palette.contrast_100 : '#F0F4F9'

  return (
    <View
      testID="userBannerOvercast"
      style={[
        styles.bannerImage,
        a.overflow_hidden,
        {backgroundColor: skyBottomColor},
      ]}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 600 150"
        preserveAspectRatio="none"
        fill="none">
        <Defs>
          <LinearGradient id="overcastBannerSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={skyTopColor} stopOpacity="1" />
            <Stop offset="1" stopColor={skyBottomColor} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="600" height="150" fill="url(#overcastBannerSky)" />
        {/* Soft sky-blue sunbreak glow */}
        <Circle
          cx="430"
          cy="42"
          r="75"
          fill={sunbreakColor}
          fillOpacity={isDark ? 0.22 : 0.45}
        />
        {/* Upper cerulean-slate overcast canopy */}
        <Path
          fill={upperCloudColor}
          d="M0 0h600v52c-38 22-94 30-148 16-42 28-108 36-168 14-48 24-116 28-174 6C72 104 30 96 0 78V0Z"
        />
        {/* Drifting mid-sky cloud bank (left to center) */}
        <Path
          fill={midCloudColor}
          opacity={0.85}
          d="M-20 42c34-18 82-12 112 14 32-20 80-16 112 8 36-12 78 4 94 32 18 32-12 62-56 60H-20V42Z"
        />
        {/* Drifting mid-sky cloud bank (right to center) */}
        <Path
          fill={midCloudColor}
          opacity={0.8}
          d="M620 36c-38-16-86-8-116 18-34-18-82-14-114 10-34-10-76 6-90 34-16 30 14 58 58 56h262V36Z"
        />
        {/* Rolling foreground cumulus clouds */}
        <Path
          fill={lowerCloudColor}
          opacity={0.78}
          d="M0 150h600v-36c-34-22-86-28-134-14-38-28-102-34-156-12-44-24-108-26-160-4-42-18-98-14-150 14v52Z"
        />
        {/* Soft horizon mist */}
        <Path
          fill={frontMistColor}
          opacity={0.85}
          d="M0 150h600v-18c-48-16-112-18-168-2-48-20-118-22-176-2-52-16-120-14-174 4-28-6-58-4-82 6v12Z"
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  editButtonContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    bottom: 8,
    right: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: {
    width: '100%',
    height: 150,
  },
  labelerBanner: {
    backgroundColor: tokens.color.temp_purple,
  },
})
