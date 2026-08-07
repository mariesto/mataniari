import { useEffect, useMemo } from 'react'
import { Box, Flex, Grid, Input, Text, Spinner, Button, useToast } from '@chakra-ui/react'
import { T, FONTS } from './theme/tokens'
import { useStore } from './store'
import Sidebar from './components/Sidebar'
import ThemeCard from './components/ThemeCard'
import InfoTip from './components/InfoTip'
import ThemeEditor from './components/editor/ThemeEditor'

export default function App() {
  const s = useStore()
  const toast = useToast()

  useEffect(() => {
    s.init()
    // sekali saja saat aplikasi dibuka
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const jumlah = useMemo(
    () => ({
      semua: s.themes.length,
      gelap: s.themes.filter((t) => !t.light).length,
      terang: s.themes.filter((t) => t.light).length,
      favorit: s.favs.length,
      bawaan: s.themes.filter((t) => t.source === 'bawaan').length,
      buatan: s.themes.filter((t) => t.source === 'buatan').length,
    }),
    [s.themes, s.favs],
  )

  const daftar = useMemo(() => {
    const q = s.query.trim().toLowerCase()
    return s.themes.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q)) return false
      if (s.filter === 'gelap' && t.light) return false
      if (s.filter === 'terang' && !t.light) return false
      if (s.filter === 'favorit' && !s.favs.includes(t.name)) return false
      return true
    })
  }, [s.themes, s.query, s.filter, s.favs])

  const ringkasan = useMemo(() => {
    const c = s.current
    if (!c) return [{ label: 'Theme', nilai: '—' }]
    if (c.mode === 'split') {
      return [
        { label: 'Light screen', nilai: c.light || '—' },
        { label: 'Dark screen', nilai: c.dark || '—' },
      ]
    }
    return [{ label: 'Theme', nilai: c.theme || "Ghostty's default" }]
  }, [s.current])

  async function pilih(nama) {
    const res = s.mode === 'split' ? await s.assignSlot(nama) : await s.applySingle(nama)
    if (!res) return // slot pertama terisi, menunggu slot kedua
    toast({
      title: res.ok ? `Terminal colors changed to ${nama}` : "The colors couldn't be changed",
      description: res.ok
        ? 'The Ghostty windows you already have open changed just now.'
        : res.alasan,
      status: res.ok ? 'success' : 'error',
      duration: res.ok ? 2200 : 6000,
      isClosable: true,
      position: 'bottom-right',
    })
  }

  if (s.loadError === 'server-unreachable') {
    return (
      <Flex h="100vh" align="center" justify="center" px="40px" textAlign="center">
        <Box>
          <Text fontFamily={FONTS.display} fontWeight={700} fontSize="17px" color={T.text} mb="6px">
            Can't reach the local app
          </Text>
          <Text fontSize="13px" color={T.textMuted}>
            The Ghostty Theme Changer server isn't responding. Start it with{' '}
            <Box as="code" color={T.text}>
              npm start
            </Box>{' '}
            and open the address it prints.
          </Text>
        </Box>
      </Flex>
    )
  }

  return (
    <Flex h="100vh" overflow="hidden" bg={T.appBg}>
      <Sidebar
        jumlah={jumlah}
        filter={s.filter}
        setFilter={s.setFilter}
        mode={s.mode}
        setMode={s.setMode}
        slotLight={s.slotLight}
        slotDark={s.slotDark}
        activeSlot={s.activeSlot}
        setActiveSlot={s.setActiveSlot}
        ringkasan={ringkasan}
      />

      {s.editing ? (
        <ThemeEditor />
      ) : (
      <Flex direction="column" flex="1" minW={0}>
        {s.previewOrphaned && (
          <Flex
            align="center"
            gap="10px"
            px="16px"
            py="9px"
            bg={T.accentSoft}
            borderBottom="1px solid"
            borderColor={T.accent}
            flexShrink={0}
          >
            <Text fontSize="12.5px" color={T.text}>
              A live preview was interrupted — your Ghostty config still points at it.
            </Text>
            <Button size="xs" variant="cta" ml="auto" onClick={() => s.resolveOrphan(true)}>
              Keep changes
            </Button>
            <Button size="xs" variant="ghostLine" onClick={() => s.resolveOrphan(false)}>
              Discard
            </Button>
          </Flex>
        )}
        {/* baris atas: cari + keterangan singkat */}
        <Flex
          align="center"
          gap="12px"
          px="16px"
          py="11px"
          borderBottom="1px solid"
          borderColor={T.line}
          bg={T.panel}
          flexShrink={0}
        >
          <Input
            value={s.query}
            onChange={(e) => s.setQuery(e.target.value)}
            placeholder="Search theme names…"
            maxW="320px"
            h="34px"
            fontSize="13px"
            bg={T.panelAlt}
            border="1px solid"
            borderColor={T.line}
            color={T.text}
            _placeholder={{ color: T.textFaint }}
            _hover={{ borderColor: T.lineStrong }}
            _focusVisible={{ borderColor: T.accent, boxShadow: 'none' }}
          />

          <Button
            variant="cta"
            size="sm"
            h="34px"
            flexShrink={0}
            onClick={() => s.startEditor(s.current?.theme)}
          >
            ＋ New / edit theme
          </Button>

          <Flex align="center" gap="6px">
            <Text fontFamily={FONTS.display} fontWeight={600} fontSize="13px" color={T.text}>
              {daftar.length}
            </Text>
            <Text fontSize="12.5px" color={T.textMuted}>
              themes shown
            </Text>
            <Text fontSize="12.5px" color={T.textFaint}>
              of {s.themes.length}
            </Text>
          </Flex>

          <Flex align="center" ml="auto" gap="2px">
            <Text fontSize="12.5px" color={T.textMuted}>
              {s.mode === 'split'
                ? `Click a theme to fill the "${s.activeSlot === 'light' ? 'light screen' : 'dark screen'}" slot`
                : 'Click any theme — the colors change right away'}
            </Text>
            <InfoTip label="The change is written straight to your Ghostty settings and every open window is told to re-read them, so you never have to close your terminal." />
            {s.busy && <Spinner size="xs" color={T.accent} ml="8px" />}
          </Flex>
        </Flex>

        {/* daftar tema */}
        <Box flex="1" overflowY="auto" px="16px" py="14px">
          {!s.loaded ? (
            <Flex h="100%" align="center" justify="center" gap="10px">
              <Spinner size="sm" color={T.accent} />
              <Text fontSize="13px" color={T.textMuted}>
                Reading the list of themes…
              </Text>
            </Flex>
          ) : daftar.length === 0 ? (
            <Flex h="100%" align="center" justify="center">
              <Text fontSize="13px" color={T.textMuted}>
                No theme matches that search.
              </Text>
            </Flex>
          ) : (
            <Grid templateColumns="repeat(auto-fill, minmax(268px, 1fr))" gap="10px">
              {daftar.map((t) => (
                <ThemeCard
                  key={t.name}
                  t={t}
                  dipakai={s.mode === 'single' && s.current?.mode === 'single' && s.current?.theme === t.name}
                  tandaSlot={
                    s.mode === 'split'
                      ? s.slotLight === t.name
                        ? 'Light screen'
                        : s.slotDark === t.name
                          ? 'Dark screen'
                          : null
                      : null
                  }
                  favorit={s.favs.includes(t.name)}
                  onPilih={pilih}
                  onFavorit={s.toggleFav}
                  onEdit={s.startEditor}
                />
              ))}
            </Grid>
          )}
        </Box>
      </Flex>
      )}
    </Flex>
  )
}
