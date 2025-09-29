import * as React from "react"

const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1280,
} as const

type DeviceType = "MOBILE" | "TABLET" | "PC"

export function useIsMobile() {
  const [device, setDevice] = React.useState<DeviceType>("PC")
  const [isLandscape, setIsLandscape] = React.useState(false)

  React.useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setIsLandscape(width > height)

      if (width < BREAKPOINTS.MOBILE) {
        setDevice("MOBILE")
      } else if (width < BREAKPOINTS.TABLET) {
        setDevice("TABLET")
      } else {
        setDevice("PC")
      }
    }

    // 초기 실행
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const isMobile = device === "MOBILE"
  const isTablet = device === "TABLET"
  const isPc = device === "PC"

  return {
    device,
    isMobile,
    isTablet,
    isPc,
    isLandscape 
  }
}