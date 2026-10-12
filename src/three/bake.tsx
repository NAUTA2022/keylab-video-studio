import React, { createContext, useContext } from 'react';

/*
 * 3D horneado: cada escena con 3D se renderiza una sola vez como secuencia PNG
 * (con transparencia) en public/baked/<clave>/<escena>-<hash>/<cuadro>.png
 * mediante `node scripts/hornear3d.mjs`. Después FullFrame3D muestra esas imágenes
 * en vez de calcular el 3D, y el 2D se renderiza encima en segundos.
 */
export type BakeState = {
  /** true mientras se hornea: solo se ve el 3D, todo lo demás queda oculto */
  baking: boolean;
  /** cuadro absoluto del video */
  absFrame: number;
  /** carpeta horneada de la escena actual (relativa a public/), si existe */
  dir?: string;
};

export const BakeContext = createContext<BakeState>({ baking: false, absFrame: 0 });
export const useBake = () => useContext(BakeContext);

/** CSS que oculta todo menos el 3D (para hornear) */
export const BakeOnly3DStyle: React.FC = () => (
  <style>{`body, body * { visibility: hidden !important; } [data-3d], [data-3d] * { visibility: visible !important; }`}</style>
);
