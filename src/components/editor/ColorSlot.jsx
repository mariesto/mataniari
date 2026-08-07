import { Flex, Box, Text, Input } from '@chakra-ui/react'
import { T, FONTS } from '../../theme/tokens'
import ColorPickerPopover from './ColorPickerPopover'

function fixHex(v) {
  let h = v.trim()
  if (h && !h.startsWith('#')) h = '#' + h
  return h
}

// One editable color: swatch (opens picker) + label + hex field.
export default function ColorSlot({ label, sub, color, onChange }) {
  return (
    <Flex align="center" gap="10px" py="5px">
      <ColorPickerPopover color={color} onChange={onChange}>
        <Box
          as="button"
          w="26px"
          h="26px"
          borderRadius="6px"
          bg={color}
          flexShrink={0}
          border="1px solid"
          borderColor={T.lineStrong}
          _hover={{ transform: 'scale(1.06)' }}
          transition="transform .1s"
        />
      </ColorPickerPopover>
      <Box flex="1" minW={0}>
        <Text fontSize="12.5px" color={T.text} fontWeight={500} noOfLines={1}>
          {label}
        </Text>
        {sub && (
          <Text fontSize="10.5px" color={T.textFaint} noOfLines={1}>
            {sub}
          </Text>
        )}
      </Box>
      <Input
        value={color}
        onChange={(e) => onChange(fixHex(e.target.value))}
        w="94px"
        size="sm"
        fontFamily={FONTS.mono}
        fontSize="12px"
        bg={T.panelAlt}
        borderColor={T.line}
        color={T.textMuted}
        _hover={{ borderColor: T.lineStrong }}
        _focusVisible={{ borderColor: T.accent, boxShadow: 'none' }}
      />
    </Flex>
  )
}
