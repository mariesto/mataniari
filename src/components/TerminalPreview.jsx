import { Box, Flex } from '@chakra-ui/react'
import { T, FONTS } from '../theme/tokens'

// The 16 palette colors as a thin strip.
export function Swatches({ palette, h = '10px' }) {
  return (
    <Flex h={h} borderRadius="3px" overflow="hidden" gap="1px">
      {palette.map((c, i) => (
        <Box key={i} flex="1" bg={c} />
      ))}
    </Flex>
  )
}

const SIZES = {
  sm: { fs: '11px', lh: '1.55', px: '10px', py: '8px' },
  lg: { fs: '13.5px', lh: '1.85', px: '16px', py: '14px' },
}

// A mock terminal painted in a theme's own colors. `t` = { background, foreground, cursor,
// selBg, selFg, palette:[16] }. Shared by the theme cards (sm) and the editor preview (lg).
export default function TerminalPreview({ t, size = 'sm' }) {
  const p = t.palette
  const cfg = SIZES[size] || SIZES.sm
  const Line = ({ children }) => <Box whiteSpace="nowrap">{children}</Box>
  return (
    <Box
      bg={t.background}
      borderRadius="7px"
      border="1px solid"
      borderColor={T.line}
      px={cfg.px}
      py={cfg.py}
      fontFamily={FONTS.mono}
      fontSize={cfg.fs}
      lineHeight={cfg.lh}
      overflow="hidden"
    >
      <Line>
        <Box as="span" color={p[2]}>
          you
        </Box>
        <Box as="span" color={t.foreground}>
          :
        </Box>
        <Box as="span" color={p[4]}>
          ~/code
        </Box>
        <Box as="span" color={t.foreground}>
          {' $ '}
        </Box>
        <Box as="span" color={p[6]}>
          git
        </Box>
        <Box as="span" color={t.foreground}>
          {' status'}
        </Box>
        <Box as="span" bg={t.cursor} color={t.background} ml="1px">
          &nbsp;
        </Box>
      </Line>
      <Line>
        <Box as="span" color={p[3]}>
          modified:
        </Box>
        <Box as="span" color={t.foreground}>
          {' notes.md '}
        </Box>
        <Box as="span" color={p[1]}>
          -12
        </Box>
        <Box as="span" color={p[2]}>
          {' +48'}
        </Box>
      </Line>
      <Line>
        <Box as="span" bg={t.selBg} color={t.selFg}>
          selected line
        </Box>
        <Box as="span" color={p[5]}>
          {' • '}
        </Box>
        <Box as="span" color={p[8] || t.foreground}>
          side note
        </Box>
      </Line>

      {size === 'lg' && (
        <>
          <Line>
            <Box as="span" color={p[5]}>
              const
            </Box>
            <Box as="span" color={t.foreground}>
              {' theme '}
            </Box>
            <Box as="span" color={p[6]}>
              =
            </Box>
            <Box as="span" color={p[2]}>
              {' "ghostty"'}
            </Box>
            <Box as="span" color={t.foreground}>
              ;
            </Box>
          </Line>
          <Line>
            <Box as="span" color={p[4]}>
              npm
            </Box>
            <Box as="span" color={t.foreground}>
              {' run '}
            </Box>
            <Box as="span" color={p[3]}>
              build
            </Box>
            <Box as="span" color={p[10] || p[2]}>
              {'   ✓ done'}
            </Box>
          </Line>
          <Flex mt="12px" borderRadius="4px" overflow="hidden">
            {p.map((c, i) => (
              <Box key={i} flex="1" h="14px" bg={c} />
            ))}
          </Flex>
        </>
      )}
    </Box>
  )
}
