import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from './api'

// ---- editor color helpers ----
// Editor draft shape: { background, foreground, cursor, selBg, selFg, palette:[16] }
function pickColors(t) {
  return {
    background: t.background,
    foreground: t.foreground,
    cursor: t.cursor,
    selBg: t.selBg,
    selFg: t.selFg,
    palette: (t.palette || []).slice(0, 16),
  }
}

function cloneColors(c) {
  return { ...c, palette: (c.palette || []).slice(0, 16) }
}

// Raw theme files may have unset (null) colors; fill from the base card so the editor is complete.
function fillColors(raw, base) {
  const palette = []
  for (let i = 0; i < 16; i++) {
    palette[i] =
      (raw.palette && raw.palette[i]) || (base.palette && base.palette[i]) || (i < 8 ? base.background : base.foreground)
  }
  return {
    background: raw.background || base.background,
    foreground: raw.foreground || base.foreground,
    cursor: raw.cursor || base.cursor,
    selBg: raw.selBg || base.selBg,
    selFg: raw.selFg || base.selFg,
    palette,
  }
}

let syncTimer = null // debounce for live-preview pushes
let fontTimer = null // debounce for font-size changes

export const useStore = create(
  persist(
    (set, get) => ({
      themes: [],
      loaded: false,
      loadError: null,
      query: '',
      filter: 'semua', // semua | gelap | terang | favorit
      mode: 'single', // single | split
      activeSlot: 'dark', // slot tujuan klik kartu saat mode split
      slotLight: null,
      slotDark: null,
      current: null, // isi baris theme di config, sudah diurai
      configExists: true,
      favs: [],
      busy: false,

      // ---- fonts (global terminal settings) ----
      fonts: [], // available families from `ghostty +list-fonts`
      fontFamily: '', // '' = system default
      fontSize: null, // null = unset (use Ghostty's default); a number once chosen
      fontBusy: false,
      fontError: null,

      init: async () => {
        try {
          const [themes, state] = await Promise.all([api.listThemes(), api.readState()])
          const patch = {
            themes,
            loaded: true,
            current: state.current,
            configExists: state.configExists,
            fontFamily: (state.font && state.font.family) || '',
            fontSize: (state.font && state.font.size) || null,
          }
          if (state.current.mode === 'split') {
            patch.mode = 'split'
            patch.slotLight = state.current.light
            patch.slotDark = state.current.dark
          }
          set(patch)
          // Font list + orphan status are optional extras — don't block the initial render.
          api
            .listFonts()
            .then((r) => set({ fonts: (r && r.fonts) || [] }))
            .catch(() => {})
          try {
            const ps = await api.previewStatus()
            if (ps && ps.orphaned) set({ previewOrphaned: true, orphanColors: ps.previewColors || null })
          } catch {
            /* status is optional */
          }
        } catch {
          // The local server isn't reachable (not started, or wrong origin/token).
          set({ loadError: 'server-unreachable', loaded: true })
        }
      },

      setQuery: (q) => set({ query: q }),
      setFilter: (f) => set({ filter: f }),
      setMode: (m) => set({ mode: m }),
      setActiveSlot: (s) => set({ activeSlot: s }),

      // ---- fonts ----
      setFontFamily: (family) => {
        set({ fontFamily: family })
        get().applyFontNow()
      },
      setFontSize: (size) => {
        set({ fontSize: size })
        if (fontTimer) clearTimeout(fontTimer)
        fontTimer = setTimeout(() => get().applyFontNow(), 250)
      },
      applyFontNow: async () => {
        set({ fontBusy: true, fontError: null })
        const res = await api.applyFont({ family: get().fontFamily, size: get().fontSize })
        set({ fontBusy: false })
        if (!res.ok) set({ fontError: res.alasan || 'Could not apply font.' })
        return res
      },

      toggleFav: (name) =>
        set((s) => ({
          favs: s.favs.includes(name) ? s.favs.filter((f) => f !== name) : [...s.favs, name],
        })),

      // klik kartu saat mode satu-tema: langsung pasang
      applySingle: async (name) => {
        set({ busy: true })
        const res = await api.applyTheme({ mode: 'single', theme: name })
        if (res.ok) set({ current: { mode: 'single', theme: name, light: null, dark: null } })
        set({ busy: false })
        return res
      },

      // klik kartu saat mode ikuti-layar: isi slot aktif; kalau dua slot penuh, pasang
      assignSlot: async (name) => {
        const s = get()
        const patch = s.activeSlot === 'light' ? { slotLight: name } : { slotDark: name }
        set(patch)
        const next = { ...s, ...patch }
        if (next.slotLight && next.slotDark) {
          set({ busy: true })
          const res = await api.applyTheme({
            mode: 'split',
            light: next.slotLight,
            dark: next.slotDark,
          })
          if (res.ok) {
            set({
              current: { mode: 'split', theme: null, light: next.slotLight, dark: next.slotDark },
            })
          }
          set({ busy: false })
          return res
        }
        return null
      },

      // ---- theme editor ----
      editing: false,
      editorBase: null, // name of the base preset the draft started from
      baseColors: null, // colors of the base (used for override diffing in Phase 3)
      draft: null, // { background, foreground, cursor, selBg, selFg, palette:[16] }
      editDirty: false,
      saving: false,
      editorError: null,
      previewOn: false, // live push to the real terminal is active
      previewSessionId: null,
      syncing: false,
      previewOrphaned: false, // a crashed preview left an include behind
      orphanColors: null,

      startEditor: async (baseName) => {
        const st = get()
        const base =
          st.themes.find((t) => t.name === baseName) ||
          st.themes.find((t) => !t.light) ||
          st.themes[0]
        if (!base) return
        let colors = pickColors(base)
        if (base.source === 'buatan') {
          // Edit real saved values, not the synthetic palette fill collectThemes adds.
          try {
            const raw = await api.readCustomTheme(base.name)
            if (raw && raw.colors) colors = fillColors(raw.colors, base)
          } catch {
            /* fall back to card colors */
          }
        }
        set({
          editing: true,
          editorBase: base.name,
          baseColors: colors,
          draft: cloneColors(colors),
          editDirty: false,
          editorError: null,
          previewOn: false,
          previewSessionId: null,
        })
      },

      setSlot: (key, hex) => {
        set((st) => ({ draft: { ...st.draft, [key]: hex }, editDirty: true }))
        get().scheduleSync()
      },
      setPaletteSlot: (i, hex) => {
        set((st) => {
          const palette = st.draft.palette.slice()
          palette[i] = hex
          return { draft: { ...st.draft, palette }, editDirty: true }
        })
        get().scheduleSync()
      },
      revertDraft: () => {
        set((st) => ({ draft: cloneColors(st.baseColors), editDirty: false }))
        get().scheduleSync()
      },
      closeEditor: async () => {
        const st = get()
        if (st.previewOn && st.previewSessionId) {
          try {
            await api.previewCancel(st.previewSessionId)
          } catch {
            /* leave it; the orphan banner will offer recovery next launch */
          }
        }
        set({
          editing: false,
          draft: null,
          baseColors: null,
          editorBase: null,
          editDirty: false,
          editorError: null,
          previewOn: false,
          previewSessionId: null,
          syncing: false,
        })
      },

      saveTheme: async (name) => {
        set({ saving: true, editorError: null })
        const res = await api.saveCustomTheme(name, get().draft)
        if (res.ok) {
          try {
            const themes = await api.listThemes()
            set({ themes })
          } catch {
            /* keep going */
          }
        } else {
          set({ editorError: res.alasan || 'Could not save the theme.' })
        }
        set({ saving: false })
        return res
      },

      updateTheme: async () => {
        const st = get()
        set({ saving: true, editorError: null })
        const res = await api.editCustomTheme(st.editorBase, st.draft)
        if (res.ok) {
          try {
            const themes = await api.listThemes()
            set({ themes, baseColors: cloneColors(st.draft), editDirty: false })
          } catch {
            /* keep going */
          }
        } else {
          set({ editorError: res.alasan || 'Could not save the theme.' })
        }
        set({ saving: false })
        return res
      },

      // ---- live preview to the real terminal ----
      scheduleSync: () => {
        if (syncTimer) clearTimeout(syncTimer)
        syncTimer = setTimeout(() => get().pushPreview(), 150)
      },
      pushPreview: async () => {
        const st = get()
        if (!st.previewOn || !st.previewSessionId) return
        set({ syncing: true })
        try {
          await api.previewUpdate(st.previewSessionId, st.draft)
        } catch {
          /* transient; next change retries */
        }
        set({ syncing: false })
      },
      toggleLive: async (on) => {
        const st = get()
        if (on) {
          const res = await api.previewStart(st.draft)
          if (res.ok) set({ previewOn: true, previewSessionId: res.sessionId, editorError: null })
          else set({ editorError: res.alasan || 'Could not start live preview.' })
          return res
        }
        try {
          if (st.previewSessionId) await api.previewCancel(st.previewSessionId)
        } catch {
          /* ignore */
        }
        set({ previewOn: false, previewSessionId: null, syncing: false })
        return { ok: true }
      },
      applyToTerminal: async ({ mode, name }) => {
        const st = get()
        set({ saving: true, editorError: null })
        const payload =
          mode === 'saveAs'
            ? { mode: 'saveAs', name, draft: st.draft }
            : { mode: 'apply', base: st.editorBase, baseColors: st.baseColors, draft: st.draft }
        const res = await api.previewCommit(st.previewSessionId, payload)
        if (res.ok) {
          try {
            const [themes, state] = await Promise.all([api.listThemes(), api.readState()])
            set({ themes, current: state.current })
          } catch {
            /* keep going */
          }
          set({ previewOn: false, previewSessionId: null, syncing: false })
        } else {
          set({ editorError: res.alasan || 'Could not apply to the terminal.' })
        }
        set({ saving: false })
        return res
      },
      resolveOrphan: async (keep) => {
        try {
          await api.previewResolve(keep)
        } catch {
          /* ignore */
        }
        try {
          const state = await api.readState()
          set({ current: state.current })
        } catch {
          /* ignore */
        }
        set({ previewOrphaned: false, orphanColors: null })
      },
    }),
    {
      name: 'gts-store',
      partialize: (s) => ({
        favs: s.favs,
        mode: s.mode,
        slotLight: s.slotLight,
        slotDark: s.slotDark,
      }),
    },
  ),
)
