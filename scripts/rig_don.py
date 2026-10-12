"""Corta don-stand.png en capas para animarlo como marioneta (cutout):
cuerpo sin antebrazo, antebrazo (gira en el codo) y bigote (va encima de la boca).
Uso: python3 scripts/rig_don.py
"""
import json
import numpy as np
from PIL import Image, ImageDraw

SRC = 'public/personajes/don-stand.png'
OUT = 'public/personajes/rig/'
im = Image.open(SRC).convert('RGBA')
W, H = im.size
a = np.array(im)

def poly_mask(pts):
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    return np.array(m) > 0

# antebrazo + mano (a la izquierda del cuerpo, hasta el borde de la manga)
arm = poly_mask([(0, 318), (134, 318), (176, 398), (160, 496), (128, 502), (0, 502)])
arm_px = a.copy(); arm_px[~arm] = 0
body = a.copy(); body[arm] = 0
# muñón de piel debajo de la manga para que el codo no deje hueco al girar
stub = Image.fromarray(arm_px)
ImageDraw.Draw(stub).ellipse((132, 420, 190, 498), fill=(242, 178, 146, 255))
stub = np.array(stub)
stub[..., 3] = np.where(arm | poly_mask([(132, 420), (190, 420), (190, 498), (132, 498)]), stub[..., 3], 0)

# bigote: píxeles oscuros en la zona del bigote
y0, y1, x0, x1 = 212, 236, 268, 345
must = np.zeros_like(a)
reg = a[y0:y1, x0:x1]
dark = (reg[..., :3].astype(int).sum(-1) < 260) & (reg[..., 3] > 0)
must[y0:y1, x0:x1][dark] = reg[dark]

def save(arr, name):
    img = Image.fromarray(arr)
    bb = img.getbbox()
    img.crop(bb).save(OUT + name + '.png')
    return {'x': bb[0], 'y': bb[1], 'w': bb[2] - bb[0], 'h': bb[3] - bb[1]}

meta = {
    'size': [W, H],
    'body': save(body, 'don-body'),
    'arm': save(stub, 'don-arm'),
    'mustache': save(must, 'don-mustache'),
    # puntos de control en coordenadas de la imagen original
    'elbow': [162, 462],
    'eyes': [[270, 177, 28, 24], [354, 174, 31, 26]],
    'mouth': [306, 236],
    'skin': '#F2B48F',
}
json.dump(meta, open(OUT + 'don.json', 'w'), indent=1)
print(meta)
