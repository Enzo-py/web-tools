/** API colonnes (public). Utilise this.model. */
export function with_columns_api(Base) {
    return class DataTableWithColumns extends Base {
      /** @returns {Array} copie profonde (structure potentiellement groupée) */
      get_columns() { return this.model.get_columns(); }
  
      /** @returns {Array<{id,label,type?,sortable?,width?,align?}>} feuilles */
      get_flat_columns() { return this.model.get_flat_columns(); }
  
      /**
       * Remplace toutes les colonnes.
       * @param {Array} cols
       * @param {{render?:boolean}} [options]
       */
      set_columns(cols, { render = true } = {}) {
        this.model.set_columns(cols);
        if (this.mode === 'virtual') {
          if (render) this._render_virtual_body?.(true);
        } else {
          this._apply_column_meta_to_thead?.(this.model.get_flat_columns());
          if (render) this._render_toolbar_dom?.();
        }
        return this;
      }
  
      /**
       * Patch une colonne feuille (align, label, type, sortable, width, …).
       * @param {string} id
       * @param {object} patch
       * @param {{render?:boolean}} [options]
       */
      update_column(id, patch = {}, { render = true } = {}) {
        this.model.update_column(id, patch);
        if (this.mode === 'virtual') {
          if (render) this._render_virtual_body?.(true);
        } else {
          const meta = this.model.get_flat_columns().find(c => c.id === id);
          this._apply_column_meta_to_thead?.({ [id]: meta });
        }
        return this;
      }
  
      /**
       * Patch de masse des colonnes (dictionnaire id -> meta).
       * @param {Record<string,object>} meta_by_id
       * @param {{render?:boolean}} [options]
       */
      set_columns_meta(meta_by_id = {}, { render = true } = {}) {
        this.model.set_columns_meta(meta_by_id);
        if (this.mode === 'virtual') {
          if (render) this._render_virtual_body?.(true);
        } else {
          this._apply_column_meta_to_thead?.(meta_by_id);
          if (render) this._render_toolbar_dom?.();
        }
        return this;
      }
    };
}
  