import { getStaticFiles, staticFile } from 'remotion';

// Devuelve la URL de un archivo de public/ solo si existe.
// Así un logo que falta deja el espacio vacío en vez de romper el render
// (y nunca se dibuja un logo de reemplazo).
export const optionalAsset = (path: string): string | null => {
  const exists = getStaticFiles().some((f) => f.name === path);
  return exists ? staticFile(path) : null;
};
