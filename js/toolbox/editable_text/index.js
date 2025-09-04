import cssText from './editable_text.css';
import { ensure_stylesheet } from '../shared/ensure_stylesheet.js';
ensure_stylesheet(cssText, "webtool__editable_text_css");

export * from './editable_text.js';
