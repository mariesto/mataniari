import { Tooltip, Box } from '@chakra-ui/react'
import { T } from '../theme/tokens'

// Ikon ⓘ + penjelasan saat disentuh kursor.
// Aturan main: detail teknis TIDAK ditumpuk di layar — sembunyikan di sini.
export default function InfoTip({ label, ml = 1.5 }) {
  return (
    <Tooltip
      label={label}
      placement="top"
      hasArrow
      openDelay={150}
      maxW="280px"
      bg={T.panelHover}
      color={T.text}
      border="1px solid"
      borderColor={T.lineStrong}
      borderRadius="6px"
      px={3}
      py={2}
      fontSize="12px"
      fontWeight={400}
      lineHeight={1.5}
    >
      <Box
        as="span"
        ml={ml}
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        w="14px"
        h="14px"
        borderRadius="full"
        border="1px solid"
        borderColor={T.textFaint}
        color={T.textFaint}
        fontSize="10px"
        fontWeight={600}
        lineHeight="1"
        cursor="help"
        _hover={{ color: T.text, borderColor: T.text }}
      >
        i
      </Box>
    </Tooltip>
  )
}
