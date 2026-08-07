import { useState } from 'react'
import { Box, Flex, Grid, Text, Button, Input, Select, Switch, Spinner, useToast } from '@chakra-ui/react'
import { T, FONTS } from '../../theme/tokens'
import { useStore } from '../../store'
import ColorSlot from './ColorSlot'
import PaletteGrid from './PaletteGrid'
import ContrastReadout from './ContrastReadout'
import EditorPreviewPane from './EditorPreviewPane'

const SectionLabel = ({ children, ...p }) => (
  <Text
    fontSize="10.5px"
    fontWeight={600}
    letterSpacing="0.08em"
    textTransform="uppercase"
    color={T.textFaint}
    {...p}
  >
    {children}
  </Text>
)

export default function ThemeEditor() {
  const s = useStore()
  const toast = useToast()
  const d = s.draft
  const [name, setName] = useState('')
  if (!d) return null

  const baseTheme = s.themes.find((t) => t.name === s.editorBase)
  const isCustomBase = baseTheme?.source === 'buatan'

  const notify = (res, okTitle, okDesc) =>
    toast({
      title: res.ok ? okTitle : 'Could not save',
      description: res.ok ? okDesc : res.alasan,
      status: res.ok ? 'success' : 'error',
      duration: res.ok ? 2500 : 6000,
      isClosable: true,
      position: 'bottom-right',
    })

  async function saveAsNew() {
    const nm = name.trim()
    if (!nm) {
      toast({ title: 'Give the theme a name first', status: 'warning', duration: 2500, position: 'bottom-right' })
      return
    }
    const res = await s.saveTheme(nm)
    notify(res, `Saved “${res.name}”`, 'It now shows up under your themes.')
    if (res.ok) setName('')
  }

  async function saveEdits() {
    const res = await s.updateTheme()
    notify(res, `Updated “${s.editorBase}”`, 'Your changes were written to the theme file.')
  }

  async function applyNow() {
    const res = await s.applyToTerminal({ mode: 'apply' })
    notify(res, 'Applied to your terminal', 'Saved as color overrides on the base theme.')
  }

  return (
    <Flex direction="column" flex="1" minW={0} h="100%">
      {/* header */}
      <Flex
        align="center"
        gap="12px"
        px="16px"
        py="10px"
        borderBottom="1px solid"
        borderColor={T.line}
        bg={T.panel}
        flexShrink={0}
      >
        <Button variant="ghostLine" size="sm" onClick={s.closeEditor}>
          ← Back
        </Button>
        <Text fontFamily={FONTS.display} fontWeight={700} fontSize="14px" color={T.text}>
          Theme editor
        </Text>
        <Flex align="center" gap="8px" ml="6px">
          <Text fontSize="12px" color={T.textFaint}>
            Base
          </Text>
          <Select
            size="sm"
            maxW="220px"
            value={s.editorBase || ''}
            onChange={(e) => s.startEditor(e.target.value)}
            bg={T.panelAlt}
            borderColor={T.line}
            color={T.text}
            fontSize="12.5px"
          >
            {s.themes.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </Select>
        </Flex>
        <Flex ml="auto" align="center" gap="16px">
          <Flex align="center" gap="8px" title="Push every change to your open Ghostty windows">
            <Switch
              size="sm"
              colorScheme="green"
              isChecked={s.previewOn}
              onChange={(e) => s.toggleLive(e.target.checked)}
            />
            <Text fontSize="12px" color={s.previewOn ? T.text : T.textFaint}>
              Live in terminal
            </Text>
            {s.syncing && <Spinner size="xs" color={T.accent} />}
          </Flex>
          <ContrastReadout draft={d} />
        </Flex>
      </Flex>

      {/* body: controls | preview */}
      <Grid templateColumns="minmax(440px, 1fr) minmax(320px, 480px)" flex="1" minH={0}>
        <Box overflowY="auto" px="18px" py="16px" borderRight="1px solid" borderColor={T.line}>
          <SectionLabel mb="6px">Main colors</SectionLabel>
          <ColorSlot
            label="Font color"
            sub="foreground — normal text"
            color={d.foreground}
            onChange={(h) => s.setSlot('foreground', h)}
          />
          <ColorSlot
            label="Background"
            sub="the terminal background"
            color={d.background}
            onChange={(h) => s.setSlot('background', h)}
          />
          <ColorSlot label="Cursor" sub="cursor-color" color={d.cursor} onChange={(h) => s.setSlot('cursor', h)} />
          <ColorSlot
            label="Selection background"
            sub="highlighted-text background"
            color={d.selBg}
            onChange={(h) => s.setSlot('selBg', h)}
          />
          <ColorSlot
            label="Selection text"
            sub="highlighted-text color"
            color={d.selFg}
            onChange={(h) => s.setSlot('selFg', h)}
          />

          <SectionLabel mt="18px" mb="8px">
            Code colors (ANSI palette)
          </SectionLabel>
          <PaletteGrid palette={d.palette} onChange={s.setPaletteSlot} />
        </Box>

        <Flex direction="column" minH={0} bg={T.appBg}>
          <Box flex="1" overflowY="auto" px="18px" py="16px">
            <SectionLabel mb="8px">Live preview</SectionLabel>
            <EditorPreviewPane draft={d} />
            <Text fontSize="11.5px" color={T.textFaint} mt="10px" lineHeight="1.5">
              Updates instantly as you tune colors. Save it as a theme to use it from the grid.
            </Text>
          </Box>

          <Box px="18px" py="12px" borderTop="1px solid" borderColor={T.line} bg={T.panel}>
            {s.editorError && (
              <Text fontSize="12px" color={T.danger} mb="8px">
                {s.editorError}
              </Text>
            )}
            <Flex gap="8px" align="center">
              <Input
                placeholder="New theme name…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                size="sm"
                bg={T.panelAlt}
                borderColor={T.line}
                color={T.text}
                maxW="190px"
                _placeholder={{ color: T.textFaint }}
              />
              <Button variant="cta" size="sm" onClick={saveAsNew} isLoading={s.saving}>
                Save as theme
              </Button>
              <Button variant="ghostLine" size="sm" onClick={applyNow} isLoading={s.saving}>
                Apply to terminal
              </Button>
              {isCustomBase && (
                <Button variant="ghostLine" size="sm" onClick={saveEdits} isLoading={s.saving}>
                  Update “{s.editorBase}”
                </Button>
              )}
              <Button variant="ghostLine" size="sm" onClick={s.revertDraft} isDisabled={!s.editDirty} ml="auto">
                Revert
              </Button>
            </Flex>
          </Box>
        </Flex>
      </Grid>
    </Flex>
  )
}
