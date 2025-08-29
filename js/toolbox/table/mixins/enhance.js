/** Mode enhance (adopt) + ingestion thead + helpers DOM. */
export function with_enhance(Base) {
    return class DataTableWithEnhance extends Base {
      /**
       * Améliore une <table> existante.
       * @param {HTMLTableElement|string} table
       * @param {object} [opts]
       */
      static enhance(table, opts = {}) {
        const inst = new this(opts);
        inst.mode = 'adopt';
  
        const t = typeof table === 'string' ? document.querySelector(table) : table;
        if (!t || t.tagName !== 'TABLE') throw new Error('enhance: provide <table>');
  
        inst._adopt_table = t;
        t.classList.add('dtbl');
        if (inst.opts.sticky_header) t.classList.add('dtbl-sticky');
  
        inst._ingest_columns_from_thead(t.tHead || t.querySelector('thead'));
  
        const wrap = document.createElement('div');
        wrap.className = 'dtbl-wrap';
        wrap.dataset.dtblId = inst.id;
        t.parentNode.insertBefore(wrap, t);
        wrap.appendChild(t);
        inst._wrap = wrap;
  
        inst._render_toolbar_dom?.();
        inst._update_sort_icons?.();
        inst._lock_column_widths?.();
        return inst;
    }


  
  
      /** @private */
    static _slug(s) {
        const x = String(s || '').trim().toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, '_')
          .replace(/^_+|_+$/g, '');
        return x ? (/\d/.test(x[0]) ? `c_${x}` : x) : 'col';
    }
    
    /**
     * @private
     * Reconstruit l'arbre de colonnes à partir du <thead> avec gestion stricte
     * de rowSpan/colSpan via une grille d'occupation.
     */
    _ingest_columns_from_thead(thead) {
        const trs = Array.from(thead?.rows || []);
        if (!trs.length) return;
      
        const grid = [];
        const nodes_by_row = trs.map(() => []);
        const _place = (r, c, th) => { (grid[r] ??= []); grid[r][c] = th; };
      
        // placement strict dans une grille
        for (let r = 0; r < trs.length; r++) {
          let c = 0;
          for (const th of trs[r].cells) {
            const cs = Math.max(1, th.colSpan || 1);
            const rs = Math.max(1, th.rowSpan || 1);
            while ((grid[r]?.[c]) != null) c++;
            const start = c, end = start + cs - 1;
            for (let rr = r; rr < r + rs; rr++) for (let cc = start; cc <= end; cc++) _place(rr, cc, th);
            nodes_by_row[r].push({ th, row: r, col_start: start, col_end: end, row_span: rs, col_span: cs });
            c = end + 1;
          }
        }
        const last_row = trs.length - 1;
      
        const _bool = v => String(v ?? '').trim().toLowerCase() === 'true';
      
        const _meta = (th, fallback) => {
          const label = (th.textContent || '').trim() || fallback;
          let id = (th.dataset.colId || '').trim();
          if (!id) { id = this.constructor._slug(label); th.dataset.colId = id; }
          const sortable   = _bool(th.dataset.sort);
          const align      = th.style.textAlign && /^(left|center|right)$/.test(th.style.textAlign) ? th.style.textAlign : null;
          const searchable = _bool(th.dataset.search); // DEFAULT = false
          return { id, label, sortable, align, searchable };
        };
      
        const _force_searchable = (node) => {
          if (node.children) node.children.forEach(_force_searchable);
          else node.searchable = true;
        };
      
        const build = (n) => {
          const child_row = n.row + n.row_span;
          const children = [];
          if (child_row <= last_row) {
            for (const ch of nodes_by_row[child_row]) {
              if (ch.col_start >= n.col_start && ch.col_end <= n.col_end) children.push(build(ch));
            }
          }
          if (children.length) {
            const m = _meta(n.th, `Group ${n.row}:${n.col_start}`);
            const group = { label: m.label, children };
            if (m.searchable) _force_searchable(group);   // propagation du flag vers toutes les feuilles
            return group;
          } else {
            const { id, label, sortable, align, searchable } = _meta(n.th, `Col ${n.row}:${n.col_start}`);
            return { id, label, sortable, align, searchable };
          }
        };
      
        const tree = nodes_by_row[0].map(build);
        this.model.set_columns(tree);
      
        // IMPORTANT: calcule le cache à partir du MODÈLE (feuilles), pas du DOM
        this._adopt_cache_searchable_indexes_from_model();
    }

    _adopt_cache_searchable_indexes_from_model() {
        const leaves = this.model.get_flat_columns();
        const idx = [];
        for (let i = 0; i < leaves.length; i++) {
          if (leaves[i]?.searchable === true) idx.push(i);
        }
        this._adopt_search_cols = idx;   // peut être [] si aucune colonne searchable
    }

    /**
        * @private
        * Construit la liste d'index de colonnes (ordre des feuilles) dont data-search!=='false'.
    */
    _adopt_cache_searchable_indexes(thead) {
        const last = thead?.rows?.[thead.rows.length - 1];
        if (!last) { this._adopt_search_cols = null; return; }
        const idx = [];
        Array.from(last.cells).forEach((th, i) => {
            const searchable = th.dataset.search === 'true'; // default false
            if (searchable) idx.push(i);
        });

        this._adopt_search_cols = idx;  // [] si aucune colonne searchable
    }
    
    /**
        * @private
        * Push meta de colonnes
    */
    _apply_column_meta_to_thead(meta) {
        if (!this._adopt_table) return;
        const thead = this._adopt_table.tHead || this._adopt_table.querySelector('thead');
        if (!thead) return;
        const last_row = thead.rows[thead.rows.length - 1];
        if (!last_row) return;
      
        const by_id = Array.isArray(meta)
          ? Object.fromEntries(meta.filter(x => x && x.id).map(x => [x.id, x]))
          : meta;
      
        for (const th of last_row.cells) {
          const id = (th.dataset.colId || '').trim();
          if (!id || !by_id[id]) continue;
          const m = by_id[id];
      
          if (m.label != null) {
            const icon = th.querySelector('.dtbl-sort');
            th.textContent = String(m.label);
            if (icon) th.appendChild(icon);
          }
          if (m.align) th.style.textAlign = m.align;
          if (m.sortable != null) {
            th.dataset.sort = m.sortable ? 'true' : 'false';
            let icon = th.querySelector('.dtbl-sort');
            if (m.sortable) {
              if (!icon) { icon = document.createElement('span'); icon.className = 'dtbl-sort'; icon.textContent = '↕'; th.appendChild(icon); }
            } else icon?.remove();
          }
          if (m.searchable != null) {
            th.dataset.search = m.searchable ? 'true' : 'false';
          }
        }
      
        // recalcule depuis le modèle (les meta ont été poussées dans le modèle par ailleurs)
        this._adopt_cache_searchable_indexes_from_model();
        this._update_sort_icons?.();
    }
      
  
    /**
        * @private
        * Filtre en DOM: ne regarde que les cellules dont l'index est dans _adopt_search_cols.
    */
    _adopt_filter(q) {
        const tbody = this._adopt_table.tBodies[0];
        const qq = (q || '').toLowerCase();
      
        if (!this._adopt_search_cols) this._adopt_cache_searchable_indexes_from_model();
        const cols_idx = this._adopt_search_cols || [];
      
        // si aucune colonne searchable => aucun match possible quand q ≠ ''
        for (const row of tbody.rows) {
          let vis = (qq === '');
          if (!vis) {
            for (let k = 0; k < cols_idx.length; k++) {
              const col_idx = cols_idx[k];
              const td = row.cells[col_idx];
              if (td && td.textContent.toLowerCase().includes(qq)) { vis = true; break; }
            }
          }
          row.dataset.hidden = vis ? 'false' : 'true';
          row.style.display  = vis ? '' : 'none';
        }
        if (this._adopt_page != null) this._apply_adopt_pagination();
        this._apply_zebra?.();
    }
      
  
    /**
        * @private
        * Trie le tbody à partir d’un clic sur <th>.
    */
    _adopt_sort(th, append, { new_first = true, tri_state = true, alt_clears_all = false, alt = false } = {}) {
        if (!th || th.dataset.sort !== 'true') return;
  
        this._adopt_sort_state ??= [];
        const idx = [...th.parentNode.children].indexOf(th);
  
        if (alt_clears_all && alt) {             // Alt+clic → clear all
          this._adopt_sort_state = [];
          this._apply_adopt_sort_to_dom();
          return;
        }
  
        const pos = this._adopt_sort_state.findIndex(s => s.index === idx);
  
        if (!append) {
          // mono-tri: asc → desc → off
          if (pos < 0) {
            this._adopt_sort_state = [{ index: idx, asc: true }];
          } else if (tri_state && this._adopt_sort_state[pos].asc) {
            this._adopt_sort_state = [{ index: idx, asc: false }];
          } else {
            this._adopt_sort_state = []; // off
          }
        } else {
          // multi-tri empilé
          if (pos < 0) {
            const it = { index: idx, asc: true };
            if (new_first) this._adopt_sort_state.unshift(it);
            else this._adopt_sort_state.push(it);
          } else {
            const s = this._adopt_sort_state[pos];
            if (tri_state && s.asc) this._adopt_sort_state[pos] = { index: idx, asc: false };
            else this._adopt_sort_state.splice(pos, 1); // off
            if (new_first && pos !== 0 && pos < this._adopt_sort_state.length) {
              const [it] = this._adopt_sort_state.splice(pos, 1);
              this._adopt_sort_state.unshift(it);
            }
          }
        }
  
        this._apply_adopt_sort_to_dom();
      }

       /** @private
     * Applique _adopt_sort_state au DOM: trie uniquement les lignes visibles,
     * puis remonte les invisibles à la fin (ordre interne préservé).
     */
    _apply_adopt_sort_to_dom() {
        const tbody = this._adopt_table?.tBodies?.[0];
        if (!tbody) return;
  
        const all = [...tbody.rows];
        const visible = all.filter(r => r.dataset.hidden !== 'true');
        const hidden  = all.filter(r => r.dataset.hidden === 'true');
        if (!this._adopt_sort_state.length) {
          // pas de tri: on ne change pas l’ordre courant
          return;
        }
  
        const coll = this.model.collator;
        visible.sort((a, b) => {
            for (const s of this._adopt_sort_state) {
                const va = a.cells[s.index]?.textContent.trim() ?? '';
                const vb = b.cells[s.index]?.textContent.trim() ?? '';
                const na = parseFloat(va), nb = parseFloat(vb);
                const cmp = (!Number.isNaN(na) && !Number.isNaN(nb)) ? (na - nb) : coll.compare(va, vb);
                if (cmp) return s.asc ? cmp : -cmp;
            }
            return 0;
        });
    
        // remet visible trié + hidden (inchangés) dans le tbody
        tbody.replaceChildren(...visible, ...hidden);
        if (this._adopt_page!=null) this._apply_adopt_pagination();
        this._apply_zebra?.();
    }
  
      /** @private */
    _adopt_page_info() {
        const vis = [...this._adopt_table.tBodies[0].rows].filter(r => r.dataset.hidden !== 'true');
        const size = this.model.page_size || vis.length;
        return { total_pages: Math.max(1, Math.ceil(vis.length / size)) };
    }
  
      /** @private */
    _apply_adopt_pagination() {
        const tbody = this._adopt_table.tBodies[0];
        const vis = [...tbody.rows].filter(r => r.dataset.hidden !== 'true');
        const size = this.model.page_size || vis.length;
        const total = Math.max(1, Math.ceil(vis.length / size));
        this._adopt_page = Math.max(1, Math.min(total, this._adopt_page || 1));
        vis.forEach((r, i) => { r.style.display = (i >= (this._adopt_page - 1) * size && i < this._adopt_page * size) ? '' : 'none'; });
        const label = this._wrap.querySelector('.dtbl-page-label'); 
        if (label) label.textContent = `Page ${this._adopt_page} / ${total}`;
        const prev = this._wrap.querySelector('.dtbl-page-prev');
        const next = this._wrap.querySelector('.dtbl-page-next');
        if (prev) prev.disabled = this._adopt_page <= 1;
        if (next) next.disabled = this._adopt_page >= total;
        this._apply_zebra?.();
      }
    };
}
  