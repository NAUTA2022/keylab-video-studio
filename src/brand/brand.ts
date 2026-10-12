// Guía de marca Key Lab para video — misma que usa la automatización
// "Key Lab · Noticia RWA → LinkedIn + video 30s".
// Regla de oro: LETRAS SIEMPRE EN COLOR SÓLIDO. Nunca degradados en texto.

export const C = {
  // Tema claro neominimalista (escenas de contenido)
  bone: '#F1EFEA', // fondo
  ink: '#141519', // tinta / texto principal
  cobalt: '#2D52FF', // único acento
  gray: '#8F8B83', // texto secundario
  line: '#DEDAD1', // líneas, bordes
  // Cierre y escenas oscuras
  night: '#0D0E11',
  white: '#FFFFFF',
  soft: '#8CA0FF', // keylab.tech en el cierre
  // Paleta alternativa "marca oscura" (videos de producto / Web3)
  navy: '#080E41',
  electric: '#011EFF',
} as const;

export const FONT = {
  display: 'Anton', // palabras gigantes
  body: 'Figtree', // todo lo demás (600-900)
} as const;

// Rejilla para 1080x1920 (9:16). Para 16:9 se escala desde layout().
export const GRID_9x16 = {
  colLeft: 140,
  colRight: 940,
  logoY: 222,
  logoH: 48,
  progressY: 1478,
  subtitleY: 1380, // subtítulos centrados encima de la barra
  uiSafeBottom: 1500, // nada importante debajo (UI de reels)
} as const;

export const layout = (width: number, height: number) => {
  const vertical = height > width;
  if (vertical) {
    return { ...GRID_9x16, vertical, width, height, colWidth: GRID_9x16.colRight - GRID_9x16.colLeft };
  }
  const colLeft = 160;
  const colRight = width - 160;
  return {
    vertical,
    width,
    height,
    colLeft,
    colRight,
    colWidth: colRight - colLeft,
    logoY: 70,
    logoH: 36,
    progressY: height - 70,
    subtitleY: height - 150,
    uiSafeBottom: height - 40,
  };
};

// Archivos de marca oficiales en public/brand/ (tomados de keylab.tech).
// Si faltan, el video NO dibuja logos de reemplazo: deja el espacio vacío.
export const BRAND_FILES = {
  logoInk: 'brand/logo-horizontal-ink.png', // fondos claros
  logoWhite: 'brand/logo-horizontal.png', // fondos oscuros
  isotipo3d: 'brand/isotipo-3d.png', // isotipo cromado 3D, protagonista del cierre
  // Recorte del wordmark "K.LAB" dentro del logo horizontal (2155 px de ancho)
  wordmarkCrop: { sx: 960, sw: 1180, total: 2155 },
} as const;
