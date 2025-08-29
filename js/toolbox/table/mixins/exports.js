/** Exports CSV/JSON + util blob. */
export function with_exports(Base) {
    return class DataTableWithExports extends Base {
      /** @returns {string} CSV (vue/page en virtual; lignes visibles en adopt) */
      to_csv() {
        if (this.mode === 'adopt') {
          const thead = this._adopt_table.tHead;
          const heads = [...thead.querySelectorAll('tr:last-child th')].map(th => th.textContent.trim());
          const tbody = this._adopt_table.tBodies[0];
          const rows = [...tbody.rows].filter(r => r.dataset.hidden !== 'true').map(r => [...r.cells].map(td => td.textContent.trim()));
          const esc = s => { s = s == null ? '' : String(s); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
          return [heads.map(esc).join(','), ...rows.map(row => row.map(esc).join(','))].join('\n');
        }
        const m = this.model.apply(); const flat = m.flat_columns();
        const { rows } = m.page_size ? m.page_slice() : { rows: m.view_rows.length ? m.view_rows : m.rows };
        const esc = s => { s = s == null ? '' : String(s); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
        const head = flat.map(c => esc(c.label)).join(',');
        const body = rows.map(r => flat.map(c => esc((m.formatters.get(c.id)?.(r[c.id], r)) ?? r[c.id] ?? '')).join(',')).join('\n');
        return `${head}\n${body}`;
      }
  
      /** @returns {string} JSON (vue/page en virtual; lignes visibles en adopt) */
      to_json() {
        if (this.mode === 'adopt') {
          const tbody = this._adopt_table.tBodies[0];
          const heads = [...this._adopt_table.tHead.querySelectorAll('tr:last-child th')]
            .map((th, i) => th.dataset.colId || th.textContent.trim() || `col${i + 1}`);
          const rows = [...tbody.rows].filter(r => r.dataset.hidden !== 'true')
            .map(r => { const o = {}; [...r.cells].forEach((td, i) => o[heads[i]] = td.textContent.trim()); return o; });
          return JSON.stringify(rows, null, 2);
        }
        const m = this.model.apply();
        const { rows } = m.page_size ? m.page_slice() : { rows: m.view_rows.length ? m.view_rows : m.rows };
        return JSON.stringify(rows, null, 2);
      }
  
      /** @private */
      static _download_blob(text, filename, type) {
        const blob = new Blob([text], { type });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = filename; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 0);
      }
    };
  }
  