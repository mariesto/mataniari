import { Box, Flex, Text, Select, Button, Spinner } from '@chakra-ui/react'
import { T, FONTS } from '../theme/tokens'
import { useStore } from '../store'
import InfoTip from './InfoTip'

const MIN = 6
const MAX = 40

export default function Typography() {
  const fonts = useStore((s) => s.fonts)
  const fontFamily = useStore((s) => s.fontFamily)
  const fontSize = useStore((s) => s.fontSize)
  const fontBusy = useStore((s) => s.fontBusy)
  const setFontFamily = useStore((s) => s.setFontFamily)
  const setFontSize = useStore((s) => s.setFontSize)

  // Keep the current family selectable even if it's not in the enumerated list.
  const options = fontFamily && !fonts.includes(fontFamily) ? [fontFamily, ...fonts] : fonts
  const shown = Number(fontSize) || 13 // effective display size when unset
  const clamp = (n) => Math.min(MAX, Math.max(MIN, n))

  return (
    <Box mb="16px">
      <Flex align="center" mb="6px">
        <Text
          fontSize="10.5px"
          fontWeight={600}
          letterSpacing="0.08em"
          textTransform="uppercase"
          color={T.textFaint}
        >
          Font
        </Text>
        <InfoTip label="Sets your terminal's primary font family and size. Applies to the windows you already have open." />
        {fontBusy && <Spinner size="xs" color={T.accent} ml="6px" />}
      </Flex>

      <Select
        size="sm"
        value={fontFamily}
        onChange={(e) => setFontFamily(e.target.value)}
        bg={T.panelAlt}
        borderColor={T.line}
        color={T.text}
        fontSize="12.5px"
        mb="8px"
        _hover={{ borderColor: T.lineStrong }}
        _focusVisible={{ borderColor: T.accent, boxShadow: 'none' }}
      >
        <option value="">System default</option>
        {options.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </Select>

      <Flex align="center" justify="space-between">
        <Text fontSize="12px" color={T.textMuted}>
          Size
        </Text>
        <Flex align="center" gap="6px">
          <Button
            variant="ghostLine"
            size="xs"
            aria-label="Decrease font size"
            onClick={() => setFontSize(clamp(shown - 1))}
          >
            −
          </Button>
          <Text
            fontFamily={FONTS.display}
            fontSize="13px"
            fontWeight={600}
            color={fontSize == null ? T.textFaint : T.text}
            minW="30px"
            textAlign="center"
          >
            {shown}
          </Text>
          <Button
            variant="ghostLine"
            size="xs"
            aria-label="Increase font size"
            onClick={() => setFontSize(clamp(shown + 1))}
          >
            +
          </Button>
        </Flex>
      </Flex>
    </Box>
  )
}
