// ============================================================
// TOKEN DESAIN — Ghostty Theme Changer
// SATU-SATUNYA tempat warna & font. Komponen DILARANG nulis hex.
// UI gelap netral: warna kartu tema jadi bintangnya.
// Kontras gate WCAG AA (teks >= 4.5, elemen besar >= 3).
// ============================================================

export const T = {
  // permukaan
  appBg: '#121419',      // latar halaman
  panel: '#191D24',      // sidebar / kartu info
  panelAlt: '#1F242D',   // kartu tema
  panelHover: '#252B37', // kartu tema:hover
  line: '#2A303B',       // garis pembatas
  lineStrong: '#3B4353', // garis aktif / hover border

  // teks (semua pasangan lolos AA di atas panel)
  text: '#E9ECF2',       // teks utama      vs appBg 15.9:1
  textMuted: '#A6AFBE',  // teks sekunder   vs panel 7.2:1
  textFaint: '#8A93A3',  // teks tersier    vs panel 5.0:1
  onAccent: '#0B2A18',   // teks di atas aksen 7.4:1

  // aksen & status
  accent: '#4ADE80',     // hijau terminal — CTA, status "dipakai"
  accentHover: '#5CE791',
  accentSoft: 'rgba(74, 222, 128, 0.13)', // lapis aksen tipis
  warn: '#FBBF24',       // favorit / peringatan
  danger: '#F87171',     // galat
  info: '#7CB8FF',       // info / badge terang

  // bayangan
  shadow: 'rgba(0, 0, 0, 0.35)',
}

export const FONTS = {
  display: 'Rubik',  // judul, angka, merek — bulet
  body: 'Inter',     // body, UI, label — ala Figma
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace', // cuma buat pratinjau terminal
}

// ---- util kontras (dipakai audit gate, bukan dekorasi) ----
export function hexToRgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(hexA, hexB) {
  const la = luminance(hexA)
  const lb = luminance(hexB)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
