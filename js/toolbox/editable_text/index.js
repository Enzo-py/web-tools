import { ensure_stylesheet } from '../shared/ensure_stylesheet.js';
ensure_stylesheet(new URL('./editable_text.css', import.meta.url));

export * from './editable_text.js';
