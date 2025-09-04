import cssText from './navigator.css';
import { ensure_stylesheet } from '../shared/ensure_stylesheet.js';
ensure_stylesheet(cssText, "webtool__navigator_css");

export * from './navigator.js';
