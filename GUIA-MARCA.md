# Guía de marca para video — Key Lab

Es la misma guía que usa la automatización "Key Lab · Noticia RWA → LinkedIn + video 30s", que corre lunes, miércoles y viernes a las 7:45 am.

## Colores
| Token | Hex | Uso |
|---|---|---|
| bone | `#F1EFEA` | Fondo de escenas claras |
| ink | `#141519` | Texto principal |
| cobalt | `#2D52FF` | Único acento |
| gray | `#8F8B83` | Texto secundario |
| line | `#DEDAD1` | Líneas y bordes |
| night | `#0D0E11` | Cierre y escenas oscuras |
| soft | `#8CA0FF` | keylab.tech en el cierre |
| navy / electric | `#080E41` / `#011EFF` | Paleta oscura alternativa (Web3) |

**Letras siempre en color sólido. Nunca degradados en texto.**

## Tipografía
- **Anton:** palabras gigantes y titulares
- **Figtree 600–900:** todo lo demás

## Layout 9:16
- Columna centrada entre x = 140 y x = 940
- Logo `logo-horizontal-ink.svg` arriba a la izquierda (y ≈ 222, 40 px de alto)
- Etiqueta de sección arriba a la derecha, con el número en cobalto
- Barra de progreso en y ≈ 1478 y subtítulos centrados encima
- Nada importante debajo de y = 1500, que es la zona de la interfaz de los reels

## Ritmo y estructura (30 s)
hook → roast cómico → noticia → **"Ey."** (silencio real) → drop en "si se puede con eso, se puede con lo tuyo" → En Key Lab construimos… → cierre con "Agenda una reunión".

Cada corte lleva zoom-punch y flash. Los datos inventados se marcan "Ejemplo ilustrativo".

## Voz (ElevenLabs)
- Voz: Martin Osborne 5 (`D7dkYvH17OKLgp4SLulf`), modelo `eleven_multilingual_v2`
- Videos argentinos: "Carlos Pro - Argentinian Documentary" (`gBTPbHzRd0ZmV75Z5Zk4`, español argentino), mismo modelo
  - Cada tanto, en videos de Argentina, alternar con el cordobés: "Franco - Argentino de Córdoba" (`kulszILr6ees0ArU8miO`)
- Español neutro con tú
- En el texto que lee la voz: "inteligencia artificial" (nunca "IA"), "erre doble be a" (nunca "RWA") y los números en letras. En pantalla sí se escribe IA, RWA y 24.

## Imágenes
- En videos de noticias van capturas reales: la nota y la web de la empresa.
- No usar logos de terceros sueltos como si fueran socios de Key Lab.
- Nunca dibujar un logo de Key Lab de reemplazo.

## Reglas de producción

### 1. Momentos fijos: iguales en TODOS los videos
- **"Ey."** Pantalla cobalto con "Ey." en Anton blanco, más el zorro de la ceja levantada (`memes/zorro-ceja.png`, sin fondo). El zorro entra desde abajo con un salto y suena el vine boom. La música queda en silencio real.
- **Cierre.** Isotipo 3D dentro de la Crystalized Ball, wordmark K.LAB, "Agenda una reunión" y keylab.tech. 2,05 s antes del final entra el sticker del zorro "Muejeje" con la risa muejeje.
- Ya vienen dentro de las escenas `ey` y `close`: no se configuran ni se cambian. También están como clips sueltos: composiciones `KL-Ey` y `KL-Cierre`, y los archivos `assets/ey.mp4` y `assets/cierre.mp4`.

### 2. Memes de contenido: pocos, separados y variados
- Entre 1 y 3 por video, nunca todos. Se rotan entre videos para no repetir los mismos.
- Cada meme va al menos a 4 s de los demás y del Ey y el cierre. `sonorizar.py` avisa si quedan muy juntos.
- Solo cuando el chiste encaja con lo que dice la voz: incredulidad, algo viejo, trasnocho o aprobación.

### 3. 3D a cuadro completo
- El lienzo 3D (`FullFrame3D`) SIEMPRE ocupa el cuadro entero: 1080×1920 en 9:16.
- Nunca se mete el 3D en una caja chica, porque cualquier animación que salga de la caja se recorta en el render.
- Se define `region`, el rectángulo donde debe verse el objeto. La cámara se desplaza (`setViewOffset`) y se ajusta el `fov` para que el objeto quede encuadrado ahí. Lo que se sale de la región sigue viéndose en el resto del cuadro.
- **Calidad:** nada de cubos sueltos ni escenas oscuras. Se usan modelos texturizados de la comunidad (Kenney CC0 en `public/3d/`, o Poly Pizza / Quaternius con licencia libre), iluminación HDRI, tone mapping ACES y sombras suaves. Cada modelo nuevo se anota en `public/3d/LICENCIAS.md`.
- **Personajes humanos (villano, inversionista, etc.):** estilo anime vectorizado — plano, sin contornos, ojos grandes de anime, cachetes rosados, sombras planas y paleta apagada. Se ilustran con IA sobre fondo verde y se recortan con chroma key (`public/personajes/*.png`, componentes `src/svg/DonExcusas.tsx` e `src/svg/Inversor.tsx`); la animación es por transformaciones (rebote, temblor, inclinación). Ningún personaje ligado a una nacionalidad real.
- **La sanguijuela** sigue en 3D estilo caricatura con la iluminación HDRI de la escena (`src/three/Leech3D.tsx`).
- **Globos de diálogo:** siempre con la librería Comical-JS (`src/components/ComicBubble.tsx`), nunca dibujados a mano.

### 4. Íconos funcionales
- Los íconos salen de **react-icons** (familia Phosphor `Pi…Fill`). Nunca se dibujan a mano.
- Registro en `src/svg/assets.tsx`:

| Clave | Ícono |
|---|---|
| `edificio` | Edificio de apartamentos |
| `lote` | Área en el mapa |
| `hotel` | Cama |
| `proyecto` | Grúa |
| `casa` | Casa |
| `bodega` | Bodega |
| `local` | Local comercial |
| `fabrica` | Fábrica |
| `finca` | Árbol |
| `oficinas` | Edificios de oficinas |
| `tokens` | Monedas |

### 5. Assets sincronizados con la voz
- Cuando la voz nombra algo concreto (edificio, celular, Excel, WhatsApp, lote, hotel), aparece su asset en ese momento exacto, sincronizado con `cues`.

### 6. Qué herramienta va en cada parte del video
| Parte | Herramienta | Ejemplo |
|---|---|---|
| Gancho | React Bits + Three.js + un meme | Pattern Waves, edificio 3D que se vuelve tokens, zorro de reojo |
| Íconos | react-icons (Phosphor) | Lote, hotel, proyecto |
| Explicaciones, demos de plataforma, ejemplos | animation-studio (canvas dibujado en código) | Wireframe a mano que se vuelve la interfaz real, celular del inversionista, cambio a "tu marca" |
| Voz | ElevenLabs, voz Martin Osborne 5 | — |
| Humor | Memes de `public/memes` + sonidos virales de `public/sfx` | Scratch, boing, vine boom, muejeje |
| "Ey." y cierre | Fijos, nunca se rehacen | Zorro de la ceja; zorro muejeje al final |

- Las explicaciones de animation-studio viven en `explicaciones/<nombre>/`, cada una como proyecto propio.
- Se renderizan en 9:16, sin audio y con fondo hueso, dejando libres la franja del logo (arriba) y la de subtítulos (abajo). El clip se pone en la escena `solution` con `"clip": "clips/<nombre>.mp4"`.
- Sus tiempos (`ev` en `score.js`) son los mismos `cues` del JSON, así que el sonido y la imagen caen juntos.
