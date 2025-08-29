import { DataTableRegistry } from '../registry.js';
import { TableState } from '../state.js';
import { TableRenderer } from '../renderer.js';

/** Noyau: état + construction du modèle/rendu. */
export class DataTableBase {
  /**
   * @param {object} [opts]
   * @param {boolean} [opts.sticky_header=true]
   * @param {string}  [opts.locale]
   */
  constructor(opts = {}) {
    this.id    = DataTableRegistry.uid();
    this.opts  = { sticky_header: true, locale: undefined, ...opts };
    this.mode  = 'virtual';                 // 'virtual' | 'adopt'
    this.model = new TableState({ locale: this.opts.locale });
    this.renderer = new TableRenderer(this);

    this.plugins = [];
    this._plugin_by_name = new Map();

    /** @private */ this._wrap = null;
    /** @private */ this._adopt_table = null;
    /** @private */ this._adopt_sort_state = null;
    /** @private */ this._adopt_page = null;

    DataTableRegistry.reg.set(this.id, this);
    DataTableRegistry.init();
  }
}
