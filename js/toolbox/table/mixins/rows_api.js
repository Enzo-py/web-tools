/** API lignes/données (public). Utilise this.model. */
export function with_rows_api(Base) {
    return class DataTableWithRows extends Base {
      /**
       * Remplace toutes les lignes.
       * @param {Array<object>} rows
       * @param {{render?:boolean}} [options]
       */
      set_rows(rows, { render = true } = {}) {
        this.model.set_rows(rows);
        if (this.mode === 'virtual') {
          if (render) this._render_virtual_body?.(false);
        } else if (render) {
          const q = this._wrap?.querySelector('.dtbl-search')?.value || '';
          this._adopt_filter?.(q);
        }
        return this;
      }
  
      /**
       * Ajoute une ou plusieurs lignes.
       * @param {object|Array<object>} rows
       * @param {{render?:boolean}} [options]
       */
      add_rows(rows = [], { render = true } = {}) {
        this.model.add_rows(rows);
        if (this.mode === 'virtual') {
          if (render) this._render_virtual_body?.(false);
        } else if (render) {
          const q = this._wrap?.querySelector('.dtbl-search')?.value || '';
          this._adopt_filter?.(q);
        }
        return this;
      }
  
      /** Vide les lignes. */
      clear_rows() {
        this.model.clear_rows();
        if (this.mode === 'virtual') this._render_virtual_body?.(false);
        else this._adopt_filter?.(this._wrap?.querySelector('.dtbl-search')?.value || '');
        return this;
      }
  
      /**
       * Patch une ligne par index.
       * @param {number} index
       * @param {object} patch
       * @param {{render?:boolean}} [options]
       */
      update_row_at(index, patch = {}, { render = false } = {}) {
        this.model.update_row_at(index, patch);
        if (render) {
          if (this.mode === 'virtual') this._render_virtual_body?.(false);
          else this._adopt_filter?.(this._wrap?.querySelector('.dtbl-search')?.value || '');
        }
        return this;
      }
  
      /**
       * Définit une cellule.
       * @param {number} index
       * @param {string} col_id
       * @param {*} value
       * @param {{render?:boolean}} [options]
       */
      set_cell_at(index, col_id, value, { render = false } = {}) {
        this.model.set_cell_at(index, col_id, value);
        if (render) {
          if (this.mode === 'virtual') this._render_virtual_body?.(false);
          else this._adopt_filter?.(this._wrap?.querySelector('.dtbl-search')?.value || '');
        }
        return this;
      }
  
      /**
       * Récupère les lignes.
       * @param {'raw'|'view'|'page'} [scope='view']
       * @returns {Array<object>}
       */
      get_rows(scope = 'view') { return this.model.get_rows(scope); }
  
      /**
       * Hydrate via dict imbriqué.
       * @param {Record<string,Record<string,any>>} dict
       * @param {string} [row_key='row']
       */
      from_nested_dict(dict, row_key = 'row') {
        const keys = new Set(); for (const c in dict) Object.keys(dict[c] || {}).forEach(r => keys.add(r));
        const rows = [...keys].map(k => { const o = { [row_key]: k }; for (const c in dict) o[c] = dict[c]?.[k]; return o; });
        return this.set_rows(rows);
      }
  
      /** Colonne formatter */
      format(col_id, fn) { this.model.format(col_id, fn); return this; }
    };
}
  