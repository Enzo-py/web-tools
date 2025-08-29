// Expose API globale + signal "prêt"
import * as cm from './context_menu/index.js';
import * as et from './editable_text/index.js';

Object.assign(window, cm, et);                        // ContextMenu, action, EditableText, ...
window.toolbox = { context_menu: cm, editable_text: et };
