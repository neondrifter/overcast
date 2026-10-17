/*
 * This is a reimplementation of what exists in our HTML template files
 * already. Once the React tree mounts, this is what gets rendered first, until
 * the app is ready to go.
 */

import {useEffect, useRef, useState} from 'react'
import Svg, {Path} from 'react-native-svg'

import {atoms as a, flattenToCSS} from '#/alf'

const size = 100
const ratio = 57 / 64

export function Splash({
  isReady,
  children,
}: React.PropsWithChildren<{
  isReady: boolean
}>) {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)
  const splashRef = useRef<HTMLDivElement>(null)

  // hide the static one that's baked into the HTML - gets replaced by our React version below
  useEffect(() => {
    // double rAF ensures that the React version gets painted first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const splash = document.getElementById('splash')
        if (splash) {
          splash.remove()
        }
      })
    })
  }, [])

  // when ready, we fade/scale out
  useEffect(() => {
    if (!isReady) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const node = splashRef.current
    if (!node || reduceMotion) {
      setIsAnimationComplete(true)
      return
    }

    const animation = node.animate(
      [
        {opacity: 1, transform: 'scale(1)'},
        {opacity: 0, transform: 'scale(1.5)'},
      ],
      {
        duration: 300,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards',
      },
    )
    animation.onfinish = () => setIsAnimationComplete(true)

    return () => {
      animation.cancel()
    }
  }, [isReady])

  return (
    <>
      {isReady && children}

      {!isAnimationComplete && (
        <div
          ref={splashRef}
          style={flattenToCSS([
            a.fixed,
            a.inset_0,
            a.flex,
            a.align_center,
            a.justify_center,
            // to compensate for the `top: -50px` below
            {transformOrigin: 'center calc(50% - 50px)'},
          ])}>
          <Svg
            fill="none"
            viewBox="0 0 64 57"
            style={[a.relative, {width: size, height: size * ratio, top: -50}]}>
            <Path
              fill="#6BAEE7"
              d="M33.5 9.2C35.8 5.9 39.7 3.8 44.1 3.8C50.5 3.8 55.9 8.4 57.1 14.5C61.0 15.6 63.8 19.2 63.8 23.5C63.8 27.6 61.2 31.1 57.5 32.3C56.1 25.3 50.8 19.9 43.9 19.2C41.8 14.5 38.1 10.9 33.5 9.2Z"
            />
            <Path
              fill="#2B7AC9"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M13.5 45C6.6 45 1 39.4 1 32.5C1 26.4 5.4 21.3 11.2 20.2C13.2 12.5 20.2 6.8 28.6 6.8C37.5 6.8 45.0 13.1 46.6 21.5C47.5 21.3 48.5 21.2 49.5 21.2C56.4 21.2 62 26.8 62 33.7C62 40.0 57.3 45 51 45H13.5ZM10.5 34.8C16.5 34.8 21.2 30.6 27.8 30.6C34.4 30.6 39.2 34.8 45.8 34.8H52.5C53.5 34.8 54.3 35.6 54.3 36.6C54.3 37.6 53.5 38.4 52.5 38.4H45.8C38.2 38.4 33.4 34.2 27.8 34.2C22.2 34.2 17.5 38.4 10.5 38.4C9.5 38.4 8.7 37.6 8.7 36.6C8.7 35.6 9.5 34.8 10.5 34.8Z"
            />
            <Path
              fill="#5299E5"
              d="M15 49.8H36.5C37.6 49.8 38.5 50.7 38.5 51.8C38.5 52.9 37.6 53.8 36.5 53.8H15C13.9 53.8 13 52.9 13 51.8C13 50.7 13.9 49.8 15 49.8ZM43.5 49.8H50C51.1 49.8 52 50.7 52 51.8C52 52.9 51.1 53.8 50 53.8H43.5C42.4 53.8 41.5 52.9 41.5 51.8C41.5 50.7 42.4 49.8 43.5 49.8Z"
            />
          </Svg>
        </div>
      )}
    </>
  )
}
