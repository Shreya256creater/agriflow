export function emitRefresh() {
  window.dispatchEvent(new Event('farmshare-refresh'));
}

export function onRefresh(fn) {
  window.addEventListener('farmshare-refresh', fn);
  return () => window.removeEventListener('farmshare-refresh', fn);
}
