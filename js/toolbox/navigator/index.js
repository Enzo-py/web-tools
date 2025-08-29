import { ensure_stylesheet } from '../shared/ensure_stylesheet.js';
ensure_stylesheet(new URL('./navigator.css', import.meta.url));

export * from './navigator.js';
