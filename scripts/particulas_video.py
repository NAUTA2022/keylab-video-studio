#!/usr/bin/env python3
"""Partículas para video: redibuja fotos con partículas, las rompe y las vuelve a armar.

Determinista (mismo resultado en cada render), sin navegador: numpy + Pillow + ffmpeg.
Efectos: redraw, explode, shatter, sand, vortex, scan, morph (de una imagen a la siguiente).

Ejemplos
  python3 particulas_video.py --img foto.png --fx redraw,explode,shatter --out clip.mp4
  python3 particulas_video.py --img a.png --img b.png --fx redraw,morph,sand --w 1920 --h 1080 --out clip.mp4
  python3 particulas_video.py --img logo.png --fx scan,vortex --alpha --out logo.mov   # ProRes 4444 con transparencia
  python3 particulas_video.py --img foto.png --fx redraw --audio pista.mp3 --out clip.mp4

Línea de tiempo: cada efecto dura --seg segundos (≈40 % rompe/dispersa, ≈45 % vuelve, 15 % quieto).
"morph" cambia a la siguiente --img. Se puede dar la duración de cada efecto con efecto:segundos (p. ej. explode:1.8).
"""
import argparse, math, subprocess
import numpy as np
from PIL import Image

ICE = np.array([140, 160, 255], np.float32)  # color de las partículas rápidas


def hex_rgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


def sample(path, W, H, scale, gap, min_lum):
    im = Image.open(path).convert('RGBA')
    bb = im.getbbox()
    if bb: im = im.crop(bb)
    s = min(W * scale / im.width, H * scale / im.height)
    w, h = max(1, int(im.width * s)), max(1, int(im.height * s))
    im = im.resize((w, h), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    if gap <= 0:  # unas 25 000 partículas para 1080 de ancho
        gap = max(2, int(round(math.sqrt(w * h / 25000))))
    ys, xs = np.mgrid[0:h:gap, 0:w:gap]
    px = a[ys, xs]
    keep = (px[..., 3] > 60) & (px[..., :3].sum(-1) > min_lum)
    x0, y0 = (W - w) / 2, (H - h) / 2
    pos = np.stack([xs[keep] + x0, ys[keep] + y0], 1).astype(np.float32)
    col = px[keep][:, :3]
    return pos, col, gap, (x0, y0, w, h)


def ease_out(t): return 1 - (1 - np.clip(t, 0, 1)) ** 3
def ease_in_out(t):
    t = np.clip(t, 0, 1); return np.where(t < 0.5, 4 * t ** 3, 1 - (-2 * t + 2) ** 3 / 2)


class Scene:
    def __init__(self, W, H, n, rng):
        self.W, self.H, self.n = W, H, n
        self.r1, self.r2, self.r3 = rng.random(n).astype(np.float32), rng.random(n).astype(np.float32), rng.random(n).astype(np.float32)


def fx_pos(name, u, home, box, sc, nxt=None):
    """Posición de cada partícula en el progreso u (0..1) del efecto. Devuelve (pos, mezcla_color_hacia_nxt)."""
    W, H = sc.W, sc.H
    x0, y0, bw, bh = box
    cx, cy = W / 2, H / 2
    hx, hy = home[:, 0], home[:, 1]
    r1, r2, r3 = sc.r1, sc.r2, sc.r3
    OUT, BACK = 0.40, 0.85          # rompe hasta 0.40, vuelve hasta 0.85
    if name == 'redraw':
        # salen de los bordes; se dibuja de izquierda a derecha
        side = (r1 * 4).astype(int)
        sx = np.select([side == 0, side == 1], [np.full_like(hx, -30), np.full_like(hx, W + 30)], r2 * W)
        sy = np.select([side == 2, side == 3], [np.full_like(hy, -30), np.full_like(hy, H + 30)], r3 * H)
        delay = (hx - x0) / max(bw, 1) * 0.45 + r3 * 0.12
        p = ease_in_out((u - delay) / 0.4)
        return np.stack([sx + (hx - sx) * p, sy + (hy - sy) * p], 1), None
    if name == 'explode':
        ang = np.arctan2(hy - cy, hx - cx) + (r1 - 0.5) * 0.7
        dist = (0.25 + r2 * 0.6) * max(W, H)
        k = np.where(u < OUT, ease_out(u / OUT), 1 - ease_in_out((u - OUT - r3 * 0.08) / (BACK - OUT - 0.08)))
        return np.stack([hx + np.cos(ang) * dist * k, hy + np.sin(ang) * dist * k], 1), None
    if name == 'shatter':
        # pedazos de vidrio que se mueven enteros (traslación + giro) y vuelven a encajar
        cw, ch = bw / 7, bh / 9
        jx, jy = np.sin(hy * 0.05) * cw * 0.35, np.cos(hx * 0.05) * ch * 0.35
        gx, gy = np.floor((hx - x0 + jx) / cw), np.floor((hy - y0 + jy) / ch)
        cid = gx * 97 + gy
        cr1 = (np.sin(cid * 12.9898) * 43758.5453) % 1
        cr2 = (np.sin(cid * 78.233) * 12345.678) % 1
        ax, ay = x0 + (gx + 0.5) * cw, y0 + (gy + 0.5) * ch
        a = np.arctan2(ay - cy, ax - cx)
        dist = (0.18 + cr1 * 0.45) * max(W, H)
        k = np.where(u < OUT, ease_out(u / OUT), 1 - ease_in_out((u - OUT - cr2 * 0.1) / (BACK - OUT - 0.1)))
        rot = (cr2 - 0.5) * 2.4 * k
        dx, dy = hx - ax, hy - ay
        px = ax + np.cos(a) * dist * k + dx * np.cos(rot) - dy * np.sin(rot)
        py = ay + np.sin(a) * dist * k + 0.25 * H * k * k * cr1 + dx * np.sin(rot) + dy * np.cos(rot)
        return np.stack([px, py], 1), None
    if name == 'sand':
        floor = H - 10 - (np.sin(hx * 0.07) + 1) * 8 - r1 * 30
        fall = np.clip(u / (OUT + 0.05), 0, 1) ** 2
        fy = np.minimum(hy + (floor - hy) * fall * 1.05, floor)
        fxp = hx + (r2 - 0.5) * 60 * fall
        delay = OUT + 0.05 + (1 - (hy - y0) / max(bh, 1)) * 0.25 + r3 * 0.05  # se rearma de abajo hacia arriba
        p = ease_in_out((u - delay) / 0.22)
        return np.stack([fxp + (hx - fxp) * p, fy + (hy - fy) * p], 1), None
    if name == 'vortex':
        dx, dy = hx - cx, hy - cy
        rad, ang = np.hypot(dx, dy), np.arctan2(dy, dx)
        k = np.where(u < OUT + 0.1, ease_in_out(u / (OUT + 0.1)), 1 - ease_in_out((u - OUT - 0.1 - r3 * 0.06) / (BACK - OUT - 0.16)))
        ang2 = ang + k * (3.5 + r1 * 2.5)
        rad2 = rad * (1 - 0.55 * k) + k * r2 * 120
        return np.stack([cx + np.cos(ang2) * rad2, cy + np.sin(ang2) * rad2], 1), None
    if name == 'scan':
        delay = (hy - y0) / max(bh, 1) * 0.6
        p = ease_out((u - delay) / 0.22)
        sx, sy = hx + (r1 - 0.5) * 60, y0 - 40 - r2 * 160
        return np.stack([sx + (hx - sx) * p, sy + (hy - sy) * p], 1), None
    if name == 'morph':
        # viaja por una curva hacia su lugar en la imagen siguiente
        tx, ty = nxt[:, 0], nxt[:, 1]
        p = ease_in_out((u - r3 * 0.2) / 0.65)
        mx = (hx + tx) / 2 + (r1 - 0.5) * W * 0.6
        my = (hy + ty) / 2 + (r2 - 0.5) * H * 0.6
        bx = (1 - p) ** 2 * hx + 2 * (1 - p) * p * mx + p * p * tx
        by = (1 - p) ** 2 * hy + 2 * (1 - p) * p * my + p * p * ty
        return np.stack([bx, by], 1), p
    raise SystemExit(f'efecto desconocido: {name}')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--img', action='append', required=True, help='imagen (PNG con fondo transparente se ve mejor); repetir para morph')
    ap.add_argument('--fx', default='redraw,explode,shatter,sand,vortex,scan', help='efectos separados por coma; efecto:segundos para duración propia')
    ap.add_argument('--seg', type=float, default=2.6, help='segundos por efecto')
    ap.add_argument('--hold', type=float, default=0.6, help='segundos quietos al final')
    ap.add_argument('--w', type=int, default=1080); ap.add_argument('--h', type=int, default=1920); ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--scale', type=float, default=0.82, help='tamaño de la imagen respecto al cuadro')
    ap.add_argument('--gap', type=int, default=0, help='píxeles entre partículas (0 = automático)')
    ap.add_argument('--size', type=float, default=0.85, help='tamaño de cada partícula respecto al gap')
    ap.add_argument('--bg', default='#050507'); ap.add_argument('--trail', type=float, default=0.72, help='0 = sin estela, 0.9 = estela larga')
    ap.add_argument('--bright', type=float, default=1.35, help='aclara los colores de la foto')
    ap.add_argument('--min-lum', type=int, default=30, help='ignora píxeles más oscuros que esto (fondo)')
    ap.add_argument('--alpha', action='store_true', help='fondo transparente → .mov ProRes 4444 para superponer en otros videos')
    ap.add_argument('--audio', help='pista de audio para mezclar')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()

    W, H, FPS = a.w, a.h, a.fps
    rng = np.random.default_rng(7)
    imgs = [sample(p, W, H, a.scale, a.gap, a.min_lum) for p in a.img]
    N = max(len(i[0]) for i in imgs)

    def fit(pos, col):  # misma cantidad de partículas en todas las imágenes
        idx = np.arange(N) % len(pos)
        perm = rng.permutation(N)
        return pos[idx][perm], col[idx][perm]
    homes = [fit(p, c) for p, c, _, _ in imgs]
    gap = min(i[2] for i in imgs)
    sc = Scene(W, H, N, rng)

    plan = []
    for tok in a.fx.split(','):
        name, _, d = tok.strip().partition(':')
        plan.append((name, float(d) if d else a.seg))
    total = sum(d for _, d in plan) + a.hold
    nfr = int(round(total * FPS))

    bg = hex_rgb(a.bg)
    sz = max(1, int(round(gap * a.size)))
    pix = 'rgba' if a.alpha else 'rgb24'
    out_args = (['-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le'] if a.alpha
                else ['-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p'])
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', pix, '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-']
    if a.audio: cmd += ['-i', a.audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-shortest']
    cmd += out_args + ([] if a.alpha else ['-movflags', '+faststart']) + [a.out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    rgb = np.zeros((H, W, 3), np.float32); rgb[:] = bg
    alpha = np.zeros((H, W), np.float32)
    img_i = 0
    home, col = homes[0]
    prev = None
    offs = [(dy, dx) for dy in range(sz) for dx in range(sz)]
    for f in range(nfr):
        t = f / FPS
        # en qué efecto estamos
        acc, cur, u = 0.0, None, 1.0
        for name, d in plan:
            if t < acc + d: cur, u = name, (t - acc) / d; break
            acc += d
        mix = None
        if cur is None:
            pos = home
        else:
            nxt = homes[(img_i + 1) % len(homes)][0] if cur == 'morph' else None
            pos, mix = fx_pos(cur, np.float32(u), home, imgs[img_i % len(imgs)][3], sc, nxt)
        # al terminar un morph, la imagen siguiente pasa a ser la de casa
        if cur != 'morph' and prev_name_is_morph(plan, t, FPS):
            img_i = (img_i + 1) % len(homes); home, col = homes[img_i]
            pos = home if cur is None else fx_pos(cur, np.float32(u), home, imgs[img_i][3], sc, None)[0]
        c = col if mix is None else col + (homes[(img_i + 1) % len(homes)][1] - col) * mix[:, None]
        c = np.minimum(255, c * a.bright + 10)
        # brillo azul hielo según velocidad
        if prev is not None and len(prev) == len(pos):
            sp = np.clip(np.hypot(*(pos - prev).T) / (W * 0.025), 0, 0.75)[:, None]
            c = c + (ICE - c) * sp
        prev = pos.copy()
        # estela
        if a.trail > 0:
            rgb = rgb * a.trail + bg * (1 - a.trail); alpha *= a.trail
        else:
            rgb[:] = bg; alpha[:] = 0
        xi, yi = np.round(pos[:, 0]).astype(np.int32), np.round(pos[:, 1]).astype(np.int32)
        for dy, dx in offs:
            x, y = xi + dx, yi + dy
            ok = (x >= 0) & (x < W) & (y >= 0) & (y < H)
            rgb[y[ok], x[ok]] = c[ok]; alpha[y[ok], x[ok]] = 1.0
        if a.alpha:
            fr = np.dstack([rgb, alpha[..., None] * 255]).astype(np.uint8)
        else:
            fr = rgb.astype(np.uint8)
        proc.stdin.write(fr.tobytes())
    proc.stdin.close(); proc.wait()
    print(f'listo: {a.out} · {N} partículas · {nfr} cuadros · {total:.1f} s')


def prev_name_is_morph(plan, t, fps):
    """True en el primer cuadro después de que terminó un morph."""
    acc = 0.0
    for name, d in plan:
        end = acc + d
        if name == 'morph' and end <= t < end + 1 / fps:
            return True
        acc = end
    return False


if __name__ == '__main__':
    main()
