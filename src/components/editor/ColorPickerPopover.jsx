import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Box,
  Input,
  Flex,
} from '@chakra-ui/react'
import { HexColorPicker } from 'react-colorful'
import { T, FONTS } from '../../theme/tokens'

function normalizeInput(v) {
  let h = v.trim()
  if (h && !h.startsWith('#')) h = '#' + h
  return h
}

// A color-wheel popover (react-colorful) with a hex field. `children` is the trigger swatch.
export default function ColorPickerPopover({ color, onChange, children }) {
  return (
    <Popover placement="right-start" isLazy gutter={10}>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent
        w="auto"
        bg={T.panel}
        borderColor={T.lineStrong}
        _focusVisible={{ outline: 'none', boxShadow: 'none' }}
      >
        <PopoverBody>
          <Box sx={{ '.react-colorful': { width: '184px', height: '160px' } }}>
            <HexColorPicker color={color} onChange={onChange} />
          </Box>
          <Flex mt="10px" align="center" gap="8px">
            <Box
              w="24px"
              h="24px"
              borderRadius="5px"
              bg={color}
              border="1px solid"
              borderColor={T.line}
              flexShrink={0}
            />
            <Input
              value={color}
              onChange={(e) => onChange(normalizeInput(e.target.value))}
              size="sm"
              fontFamily={FONTS.mono}
              fontSize="12px"
              bg={T.panelAlt}
              borderColor={T.line}
              color={T.text}
            />
          </Flex>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}
