"""Descarga y grada las fotografías de AMBIENTE del sitio.

IMPORTANTE — procedencia: la clínica no facilitó fotos propias y en este
entorno no había herramienta de generación de imagen, así que se usan
fotografías con licencia Unsplash (uso comercial libre, sin permiso) elegidas
para el concepto "calma atlántica": mar gallego, cerámica/lino y una sala
dental genérica. NINGUNA es una foto real de la Clínica Dental Louzao y la
web las etiqueta como "fotografía de ambiente". Sustituir por fotografía
propia o generada en cuanto exista — la estructura no depende de ellas.

  mar-pantin   Tino Rischawy      https://unsplash.com/photos/7-0o_SrXUdw  (ola en Pantín, Galicia)
  mar-malpica  Eduardo Fernández  https://unsplash.com/photos/fGw__kecM6o  (Praia de Malpica, Costa da Morte)
  praia-bruma  Lydia Lögga        https://unsplash.com/photos/NMX4Wh4IR6U  (playa con bruma)
  ceramica     Suzanne Boureau    https://unsplash.com/photos/vG9Y8YvzdSQ  (cerámica artesanal y lino)
  tarros       Yana Hurska        https://unsplash.com/photos/rAVSjxz6mNo  (tarros de cerámica)
  gabinete     Kari Bjorn Photo.  https://unsplash.com/photos/Fdku_oMrDvk  (gabinete dental genérico)

Gradación común (coherencia de color): blancos cálidos, sombras viradas a
teal, saturación contenida, contraste suave. Genera -1600 / -900 y un LQIP
real (miniatura borrosa en archivo) para el blur-up.
"""
import os, urllib.request, concurrent.futures
import numpy as np
from PIL import Image, ImageFilter

PHOTOS = {
    "mar-pantin": "photo-1677709678859-a91a75afc1fd",
    "mar-malpica": "photo-1562000068-e17f6dcecea4",
    "praia-bruma": "photo-1656925313344-2a490c081b8f",
    "ceramica": "photo-1610128361323-6e941c97f023",
    "tarros": "photo-1631125915973-e0d155a14e4e",
    "gabinete": "photo-1704455306251-b4634215d98f",
}
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "img", "photos")
os.makedirs(OUT, exist_ok=True)

TEAL = np.array([0x0F, 0x6E, 0x8C]) / 255.0   # sombras
WARM = np.array([0xF7, 0xF4, 0xEE]) / 255.0   # luces


def grade(im: Image.Image) -> Image.Image:
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
    lum = a @ np.array([0.299, 0.587, 0.114])
    # saturación contenida
    a = lum[..., None] + (a - lum[..., None]) * 0.82
    # contraste suave (levantar negros, bajar blancos un pelo)
    a = 0.06 + a * 0.90
    # split-toning: sombras -> teal, luces -> hueso cálido
    sh = np.clip(1.0 - lum, 0, 1)[..., None] ** 2
    hi = np.clip(lum - 0.55, 0, 1)[..., None] * 1.6
    a = a + (TEAL - 0.5) * 0.16 * sh + (WARM - 0.5) * 0.18 * hi
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def fetch(pid, w):
    url = f"https://images.unsplash.com/{pid}?w={w}&q=84&fm=jpg&fit=max"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=240) as r:
        return r.read()


def process(name):
    pid = PHOTOS[name]
    src = os.path.join(OUT, f"{name}-src.jpg")
    if not os.path.exists(src):
        with open(src, "wb") as f:
            f.write(fetch(pid, 1800))
    im = grade(Image.open(src))
    for w in (1600, 900):
        r = im.copy(); r.thumbnail((w, w * 3), Image.LANCZOS)
        r.save(os.path.join(OUT, f"{name}-{w}.jpg"), quality=82, optimize=True, progressive=True)
    tiny = im.copy(); tiny.thumbnail((32, 96), Image.LANCZOS)
    tiny.filter(ImageFilter.GaussianBlur(1.5)).save(os.path.join(OUT, f"{name}-lqip.jpg"), quality=45)
    os.remove(src)
    return name, im.size


if __name__ == "__main__":
    with concurrent.futures.ThreadPoolExecutor(3) as ex:
        for r in ex.map(process, list(PHOTOS)):
            print(r)
