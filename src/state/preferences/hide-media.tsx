import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

export type MediaOverlayStyle = NonNullable<
  persisted.Schema['mediaOverlayStyle']
>
type OverlayStyleStateContext = MediaOverlayStyle
type OverlayStyleSetContext = (v: MediaOverlayStyle) => void

const hideMediaStateContext = createContext<StateContext>(
  Boolean(persisted.defaults.hideMedia),
)
hideMediaStateContext.displayName = 'HideMediaStateContext'
const hideMediaSetContext = createContext<SetContext>((_: boolean) => {})
hideMediaSetContext.displayName = 'HideMediaSetContext'

const hideProfileMediaStateContext = createContext<StateContext>(
  Boolean(persisted.defaults.hideProfileMedia),
)
hideProfileMediaStateContext.displayName = 'HideProfileMediaStateContext'
const hideProfileMediaSetContext = createContext<SetContext>((_: boolean) => {})
hideProfileMediaSetContext.displayName = 'HideProfileMediaSetContext'

const mediaOverlayStyleStateContext = createContext<OverlayStyleStateContext>(
  persisted.defaults.mediaOverlayStyle ?? 'clouds',
)
mediaOverlayStyleStateContext.displayName = 'MediaOverlayStyleStateContext'
const mediaOverlayStyleSetContext = createContext<OverlayStyleSetContext>(
  (_: MediaOverlayStyle) => {},
)
mediaOverlayStyleSetContext.displayName = 'MediaOverlayStyleSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [hideMedia, setHideMedia] = useState(
    Boolean(persisted.get('hideMedia')),
  )
  const [hideProfileMedia, setHideProfileMedia] = useState(
    Boolean(persisted.get('hideProfileMedia')),
  )
  const [mediaOverlayStyle, setMediaOverlayStyle] = useState<MediaOverlayStyle>(
    persisted.get('mediaOverlayStyle') ?? 'clouds',
  )

  const setHideMediaWrapped = useCallback(
    (next: persisted.Schema['hideMedia']) => {
      setHideMedia(Boolean(next))
      void persisted.write('hideMedia', next)
    },
    [],
  )

  const setHideProfileMediaWrapped = useCallback(
    (next: persisted.Schema['hideProfileMedia']) => {
      setHideProfileMedia(Boolean(next))
      void persisted.write('hideProfileMedia', next)
    },
    [],
  )

  const setMediaOverlayStyleWrapped = useCallback((next: MediaOverlayStyle) => {
    const resolved = next ?? 'clouds'
    setMediaOverlayStyle(resolved)
    void persisted.write('mediaOverlayStyle', resolved)
  }, [])

  useEffect(() => {
    return persisted.onUpdate('hideMedia', nextHideMedia => {
      setHideMedia(Boolean(nextHideMedia))
    })
  }, [])

  useEffect(() => {
    return persisted.onUpdate('hideProfileMedia', nextHideProfileMedia => {
      setHideProfileMedia(Boolean(nextHideProfileMedia))
    })
  }, [])

  useEffect(() => {
    return persisted.onUpdate('mediaOverlayStyle', nextOverlayStyle => {
      setMediaOverlayStyle(nextOverlayStyle ?? 'clouds')
    })
  }, [])

  return (
    <hideMediaStateContext.Provider value={hideMedia}>
      <hideMediaSetContext.Provider value={setHideMediaWrapped}>
        <hideProfileMediaStateContext.Provider value={hideProfileMedia}>
          <hideProfileMediaSetContext.Provider
            value={setHideProfileMediaWrapped}>
            <mediaOverlayStyleStateContext.Provider value={mediaOverlayStyle}>
              <mediaOverlayStyleSetContext.Provider
                value={setMediaOverlayStyleWrapped}>
                {children}
              </mediaOverlayStyleSetContext.Provider>
            </mediaOverlayStyleStateContext.Provider>
          </hideProfileMediaSetContext.Provider>
        </hideProfileMediaStateContext.Provider>
      </hideMediaSetContext.Provider>
    </hideMediaStateContext.Provider>
  )
}

export function useHideMediaEnabled() {
  return useContext(hideMediaStateContext)
}

export function useSetHideMediaEnabled() {
  return useContext(hideMediaSetContext)
}

export function useHideProfileMediaEnabled() {
  return useContext(hideProfileMediaStateContext)
}

export function useSetHideProfileMediaEnabled() {
  return useContext(hideProfileMediaSetContext)
}

export function useMediaOverlayStyle() {
  return useContext(mediaOverlayStyleStateContext)
}

export function useSetMediaOverlayStyle() {
  return useContext(mediaOverlayStyleSetContext)
}
