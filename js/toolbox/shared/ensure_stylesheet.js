export function ensure_stylesheet(css, id) {
  if (typeof document === 'undefined') return;
  if (id && document.getElementById(id)) return;
  const el = document.createElement('style');
  if (id) el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}
