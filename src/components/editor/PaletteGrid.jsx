import { Grid, Flex, Box, Text } from '@chakra-ui/react'
import { T, FONTS } from '../../theme/tokens'
import ColorPickerPopover from './ColorPickerPopover'

// ANSI color roles — these are the "code colors" programs like vim/bat/ls use.
const NAMES = [
  'Black',
  'Red',
  'Green',
  'Yellow',
  'Blue',
  'Magenta',
  'Cyan',
  'White',
  'Bright Black',
  'Bright Red',
  'Bright Green',
  'Bright Yellow',
  'Bright Blue',
  'Bright Magenta',
  'Bright Cyan',
  'Bright White',
]

export default function PaletteGrid({ palette, onChange }) {
  return (
    <Grid templateColumns="repeat(2, 1fr)" columnGap="16px" rowGap="1px">
      {palette.map((c, i) => (
        <Flex key={i} align="center" gap="8px" py="3px">
          <ColorPickerPopover color={c} onChange={(hex) => onChange(i, hex)}>
            <Box
              as="button"
              w="22px"
              h="22px"
              borderRadius="5px"
              bg={c}
              flexShrink={0}
              border="1px solid"
              borderColor={T.lineStrong}
              _hover={{ transform: 'scale(1.08)' }}
              transition="transform .1s"
            />
          </ColorPickerPopover>
          <Text fontSize="11px" color={T.textMuted} flex="1" noOfLines={1}>
            <Box as="span" color={T.textFaint}>
              {i}.
            </Box>{' '}
            {NAMES[i]}
          </Text>
          <Text fontSize="10.5px" color={T.textFaint} fontFamily={FONTS.mono}>
            {(c || '').toUpperCase()}
          </Text>
        </Flex>
      ))}
    </Grid>
  )
}
