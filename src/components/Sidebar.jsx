import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import { T, FONTS } from '../theme/tokens'
import InfoTip from './InfoTip'

// Sidebar gelap → semua teks di dalamnya terang (gate kontras, tidak boleh gelap-di-gelap).

function Judul({ children, tip }) {
  return (
    <Flex align="center" mb="6px">
      <Text
        fontSize="10.5px"
        fontWeight={600}
        letterSpacing="0.08em"
        textTransform="uppercase"
        color={T.textFaint}
      >
        {children}
      </Text>
      {tip && <InfoTip label={tip} />}
    </Flex>
  )
}

function Pilihan({ aktif, onClick, children, kanan }) {
  return (
    <Flex
      as="button"
      onClick={onClick}
      w="100%"
      align="center"
      justify="space-between"
      px="9px"
      py="6px"
      borderRadius="6px"
      bg={aktif ? T.accentSoft : 'transparent'}
      color={aktif ? T.text : T.textMuted}
      border="1px solid"
      borderColor={aktif ? T.accent : 'transparent'}
      fontSize="12.5px"
      fontWeight={aktif ? 600 : 400}
      _hover={{ bg: aktif ? T.accentSoft : T.panelAlt, color: T.text }}
      transition="background .12s, color .12s"
    >
      <Text>{children}</Text>
      {kanan != null && (
        <Text fontFamily={FONTS.display} fontSize="11px" color={T.textFaint}>
          {kanan}
        </Text>
      )}
    </Flex>
  )
}

function Slot({ nama, isi, aktif, onClick }) {
  return (
    <Flex
      as="button"
      onClick={onClick}
      w="100%"
      direction="column"
      align="flex-start"
      px="9px"
      py="7px"
      borderRadius="7px"
      bg={aktif ? T.accentSoft : T.panelAlt}
      border="1px solid"
      borderColor={aktif ? T.accent : T.line}
      _hover={{ borderColor: aktif ? T.accent : T.lineStrong }}
      transition="border-color .12s"
    >
      <Text fontSize="10.5px" color={T.textFaint}>
        {nama}
      </Text>
      <Text fontSize="12.5px" fontWeight={600} color={isi ? T.text : T.textFaint} noOfLines={1}>
        {isi || 'not picked yet'}
      </Text>
    </Flex>
  )
}

export default function Sidebar({
  jumlah,
  filter,
  setFilter,
  mode,
  setMode,
  slotLight,
  slotDark,
  activeSlot,
  setActiveSlot,
  ringkasan,
}) {
  return (
    <Flex
      direction="column"
      w="248px"
      flexShrink={0}
      bg={T.panel}
      borderRight="1px solid"
      borderColor={T.line}
      px="14px"
      py="14px"
      h="100%"
      overflowY="auto"
    >
      <Box mb="16px">
        <Text fontFamily={FONTS.display} fontWeight={700} fontSize="15px" color={T.text} lineHeight="1.2">
          Theme Changer
        </Text>
        <Text fontSize="11.5px" color={T.textFaint}>
          for the Ghostty terminal
        </Text>
      </Box>

      <Box mb="16px">
        <Judul tip="One theme: your terminal always looks the same. Follow light and dark: the terminal switches by itself, depending on whether your computer is in light or dark mode.">
          How colors are used
        </Judul>
        <VStack spacing="4px" align="stretch">
          <Pilihan aktif={mode === 'single'} onClick={() => setMode('single')}>
            One theme only
          </Pilihan>
          <Pilihan aktif={mode === 'split'} onClick={() => setMode('split')}>
            Follow light and dark
          </Pilihan>
        </VStack>
      </Box>

      {mode === 'split' && (
        <Box mb="16px">
          <Judul tip="Pick the slot you want to fill, then click a theme on the right. Once both slots are filled, the pair is applied straight away.">
            Theme pair
          </Judul>
          <VStack spacing="6px" align="stretch">
            <Slot
              nama="When the screen is light"
              isi={slotLight}
              aktif={activeSlot === 'light'}
              onClick={() => setActiveSlot('light')}
            />
            <Slot
              nama="When the screen is dark"
              isi={slotDark}
              aktif={activeSlot === 'dark'}
              onClick={() => setActiveSlot('dark')}
            />
          </VStack>
        </Box>
      )}

      <Box mb="16px">
        <Judul>Filter the list</Judul>
        <VStack spacing="4px" align="stretch">
          <Pilihan aktif={filter === 'semua'} onClick={() => setFilter('semua')} kanan={jumlah.semua}>
            All themes
          </Pilihan>
          <Pilihan aktif={filter === 'gelap'} onClick={() => setFilter('gelap')} kanan={jumlah.gelap}>
            Dark ones
          </Pilihan>
          <Pilihan aktif={filter === 'terang'} onClick={() => setFilter('terang')} kanan={jumlah.terang}>
            Light ones
          </Pilihan>
          <Pilihan aktif={filter === 'favorit'} onClick={() => setFilter('favorit')} kanan={jumlah.favorit}>
            My favorites
          </Pilihan>
        </VStack>
      </Box>

      <Box mb="16px">
        <Judul>Where they come from</Judul>
        <VStack spacing="3px" align="stretch">
          {[
            { label: 'Ghostty built-in', nilai: jumlah.bawaan },
            { label: 'Your own', nilai: jumlah.buatan },
          ].map((r) => (
            <Flex key={r.label} justify="space-between">
              <Text fontSize="12px" color={T.textMuted}>
                {r.label}
              </Text>
              <Text fontFamily={FONTS.display} fontSize="12px" color={T.text}>
                {r.nilai}
              </Text>
            </Flex>
          ))}
        </VStack>
        <Text fontSize="11.5px" color={T.textFaint} mt="8px" lineHeight="1.5">
          Drop your own theme files into Ghostty's theme folder, then reopen this app.
        </Text>
      </Box>

      <Box mt="auto" pt="12px" borderTop="1px solid" borderColor={T.line}>
        <Judul tip="Your choice is saved in your own Ghostty settings file. The previous version is always backed up, and the last five backups are kept.">
          In use right now
        </Judul>
        {ringkasan.map((r) => (
          <Flex key={r.label} justify="space-between" gap="8px" mb="3px">
            <Text fontSize="11.5px" color={T.textFaint} flexShrink={0}>
              {r.label}
            </Text>
            <Text fontSize="11.5px" fontWeight={600} color={T.text} noOfLines={1} textAlign="right">
              {r.nilai}
            </Text>
          </Flex>
        ))}
      </Box>
    </Flex>
  )
}
