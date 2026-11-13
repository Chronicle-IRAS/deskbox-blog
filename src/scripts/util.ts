export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 每次页面切换都会新建一个 AbortController，页面级监听器挂在它的 signal 上 */
let ctrl = new AbortController();
export const pageSignal = () => ctrl.signal;
export function resetPage() {
  ctrl.abort();
  ctrl = new AbortController();
  return ctrl.signal;
}
