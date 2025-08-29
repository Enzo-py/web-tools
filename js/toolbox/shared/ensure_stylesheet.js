export function ensure_stylesheet(url) {
    const href = typeof url === 'string' ? url : url.href;
    if (document.querySelector(`link[data-autocss="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.autocss = href;
    document.head.appendChild(link);
}
  