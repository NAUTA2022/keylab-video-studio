// Reloj virtual: los componentes ORIGINALES de React Bits llaman a
// requestAnimationFrame / performance.now. En esta carpeta esas llamadas
// se redirigen aquí (ver scripts/import-reactbits.mjs), y <ClockDriver/>
// avanza el reloj exactamente un cuadro de video por vez.
// Resultado: el efecto se ve idéntico al de reactbits.dev, pero sin saltos.

type Cb = (t: number) => void;

let nowMs = 0;
let nextId = 1;
const queue = new Map<number, Cb>();

export const vNow = () => nowMs;

export const vRaf = (cb: Cb): number => {
  const id = nextId++;
  queue.set(id, cb);
  return id;
};

export const vCaf = (id: number) => {
  queue.delete(id);
};

export const vTick = (ms: number) => {
  nowMs = ms;
  const cbs = [...queue.values()];
  queue.clear();
  for (const cb of cbs) {
    try {
      cb(ms);
    } catch (e) {
      console.error(e);
    }
  }
};

// En video el componente siempre está "visible": este observador avisa enseguida.
export class VIntersectionObserver {
  private cb: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
  }
  observe(el: Element) {
    const entry = { isIntersecting: true, intersectionRatio: 1, target: el } as unknown as IntersectionObserverEntry;
    this.cb([entry], this as unknown as IntersectionObserver);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
