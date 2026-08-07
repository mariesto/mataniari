import { extendTheme } from '@chakra-ui/react'
import { T, FONTS } from './tokens'

export const chakraTheme = extendTheme({
  config: { initialColorMode: 'dark', useSystemColorMode: false },
  fonts: {
    heading: `${FONTS.display}, system-ui, sans-serif`,
    body: `${FONTS.body}, system-ui, sans-serif`,
    mono: FONTS.mono,
  },
  colors: {
    ui: {
      appBg: T.appBg,
      panel: T.panel,
      panelAlt: T.panelAlt,
      panelHover: T.panelHover,
      line: T.line,
      lineStrong: T.lineStrong,
      text: T.text,
      muted: T.textMuted,
      faint: T.textFaint,
      accent: T.accent,
      onAccent: T.onAccent,
      warn: T.warn,
      danger: T.danger,
      info: T.info,
    },
  },
  styles: {
    global: {
      body: { bg: T.appBg, color: T.text, fontSize: '14px', lineHeight: 1.45 },
      '::selection': { bg: T.accentSoft },
    },
  },
  components: {
    Button: {
      variants: {
        cta: {
          bg: T.accent,
          color: T.onAccent,
          fontWeight: 600,
          _hover: { bg: T.accentHover, _disabled: { bg: T.accent } },
          _disabled: { opacity: 0.45, cursor: 'not-allowed' },
        },
        ghostLine: {
          bg: 'transparent',
          color: T.textMuted,
          border: '1px solid',
          borderColor: T.lineStrong,
          _hover: { color: T.text, borderColor: T.textFaint },
        },
      },
    },
  },
})
