import { memo } from 'react'
import { Box, Flex, Text, HStack } from '@chakra-ui/react'
import { T, FONTS, contrast } from '../theme/tokens'
import TerminalPreview, { Swatches } from './TerminalPreview'

function ThemeCard({ t, dipakai, tandaSlot, favorit, onPilih, onFavorit, onEdit }) {
  const rasio = contrast(t.foreground, t.background)
  const aktif = dipakai || !!tandaSlot

  return (
    <Box
      as="button"
      onClick={() => onPilih(t.name)}
      textAlign="left"
      w="100%"
      bg={T.panelAlt}
      border="1px solid"
      borderColor={aktif ? T.accent : T.line}
      borderRadius="10px"
      p="10px"
      position="relative"
      sx={{ contentVisibility: 'auto', containIntrinsicSize: '160px' }}
      transition="background .12s, border-color .12s, transform .12s"
      _hover={{ bg: T.panelHover, borderColor: aktif ? T.accent : T.lineStrong, transform: 'translateY(-1px)' }}
      _focusVisible={{ outline: '2px solid', outlineColor: T.info, outlineOffset: '2px' }}
    >
      <Flex align="center" gap="6px" mb="7px">
        <Text
          fontFamily={FONTS.display}
          fontWeight={600}
          fontSize="13px"
          color={T.text}
          noOfLines={1}
          flex="1"
          title={t.name}
        >
          {t.name}
        </Text>

        {aktif && (
          <Text
            fontSize="10px"
            fontWeight={600}
            color={T.onAccent}
            bg={T.accent}
            px="6px"
            py="1px"
            borderRadius="4px"
            whiteSpace="nowrap"
          >
            {tandaSlot || 'In use'}
          </Text>
        )}

        {onEdit && (
          <Box
            as="span"
            role="button"
            aria-label={t.source === 'buatan' ? 'Edit this theme' : 'Use as a starting point'}
            title={t.source === 'buatan' ? 'Edit this theme' : 'Use as a base for a new theme'}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(t.name)
            }}
            fontSize="12px"
            lineHeight="1"
            color={T.textFaint}
            _hover={{ color: T.accent }}
            px="2px"
          >
            ✎
          </Box>
        )}

        <Box
          as="span"
          role="button"
          aria-label={favorit ? 'Remove from favorites' : 'Add to favorites'}
          onClick={(e) => {
            e.stopPropagation()
            onFavorit(t.name)
          }}
          fontSize="13px"
          lineHeight="1"
          color={favorit ? T.warn : T.textFaint}
          _hover={{ color: T.warn }}
          px="2px"
        >
          {favorit ? '★' : '☆'}
        </Box>
      </Flex>

      <TerminalPreview t={t} size="sm" />

      <Box mt="7px">
        <Swatches palette={t.palette} />
      </Box>

      <HStack mt="7px" spacing="10px" fontSize="10.5px" color={T.textFaint} whiteSpace="nowrap">
        <Text color={t.light ? T.info : T.textMuted}>{t.light ? 'Light' : 'Dark'}</Text>
        <Text>{t.source === 'buatan' ? 'Yours' : 'Built-in'}</Text>
        <Text>Background {t.background.toUpperCase()}</Text>
        <Text color={rasio >= 4.5 ? T.textFaint : T.warn} ml="auto">
          Legibility {rasio.toFixed(1)}
        </Text>
      </HStack>
    </Box>
  )
}

export default memo(ThemeCard)
