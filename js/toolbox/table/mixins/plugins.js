/** Plugins: registre statique + .use() */
export function with_plugins(Base) {
    return class DataTableWithPlugins extends Base {
      static plugins = Object.create(null);
      static _names  = [];
  
      /**
       * Enregistre un plugin ('pagination', 'search'…) et l’expose en DataTable.Pagination.
       * @param {string} name
       * @param {Function} cls
       */
      static register_plugin(name, cls) {
        const key = String(name).toLowerCase();
        this.plugins[key] = cls;
        if (!this._names.includes(key)) this._names.push(key);
        const Pascal = key.replace(/(^|[_-])(\w)/g, (_, __, c) => c.toUpperCase());
        if (!Object.hasOwn(this, Pascal)) Object.defineProperty(this, Pascal, { value: cls, enumerable: true });
      }
  
      /** @returns {string[]} noms des plugins enregistrés */
      static plugin_names() { return [...this._names]; }
  
      /**
       * Attache un plugin par nom ou par instance. Expose aussi table.<nom>.
       * @param {string|object} plugin_or_name
       * @param {object} [opts]
       * @returns {this}
       */
      use(plugin_or_name, opts) {
        let inst, name;
        if (typeof plugin_or_name === 'string') {
          name = plugin_or_name.toLowerCase();
          const Cls = this.constructor.plugins[name];
          if (!Cls) throw new Error(`unknown plugin "${name}". Available: ${this.constructor.plugin_names().join(', ') || 'none'}`);
          inst = new Cls(opts || {});
        } else {
          inst = plugin_or_name;
          name = (inst?.name || inst?.constructor?.name || 'plugin').toString().toLowerCase();
        }
        inst.attach?.(this);
        this.plugins.push(inst);
        this._plugin_by_name.set(name, inst);
        const prop = name.replace(/-+/g, '_');
        if (!Object.hasOwn(this, prop)) Object.defineProperty(this, prop, { value: inst, enumerable: true });
        this._render_toolbar_dom?.();
        return this;
      }
    };
}
  