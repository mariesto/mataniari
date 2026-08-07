import { Flex, Text } from '@chakra-ui/react'
import { T, FONTS, contrast } from '../../theme/tokens'

function Chip({ label, ratio }) {
  const ok = ratio >= 4.5
  return (
    <Flex align="center" gap="6px">
      <Text fontSize="11px" color={T.textFaint}>
        {label}
      </Text>
      <Text fontFamily={FONTS.display} fontSize="12.5px" fontWeight={600} color={ok ? T.text : T.warn}>
        {ratio.toFixed(2)}
      </Text>
    </Flex>
  )
}

// Live legibility readouts; amber below the 4.5 WCAG-ish threshold.
export default function ContrastReadout({ draft }) {
  return (
    <Flex gap="20px" align="center" wrap="wrap">
      <Chip label="Text / background" ratio={contrast(draft.foreground, draft.background)} />
      <Chip label="Selection" ratio={contrast(draft.selFg, draft.selBg)} />
    </Flex>
  )
}
