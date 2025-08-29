/** DOM & rendu virtual + toolbars. */
export function with_dom(Base) {
    return class DataTableWithDom extends Base {
      /** Stringification (virtual) */
      toString() {
        return `<div class="dtbl-wrap" data-dtbl-id="${this.id}">${this.renderer.toolbar_html()}${this.renderer.table_html()}</div>`;
      }
  
      /**
       * @private
       * Met à jour le DOM (virtual). Si update_header=true, reconstruit <table>.
       * @param {boolean} [update_header=false]
       */
      _render_virtual_body(update_header = false) {
        const wrap = document.querySelector(`[data-dtbl-id="${this.id}"]`); if (!wrap) return;
        if (update_header) wrap.querySelector('table')?.remove();
        if (update_header) {
          wrap.insertAdjacentHTML('beforeend', this.renderer.table_html());
        } else {
          const table = wrap.querySelector('table'); if (!table) { wrap.insertAdjacentHTML('beforeend', this.renderer.table_html()); return; }
          const tbody_new = document.createElement('tbody');
          const m = this.model.apply(); const { rows, page, total_pages } = m.page_slice(); const flat = m.flat_columns();
          for (const r of rows) {
            const tr = document.createElement('tr');
            for (const c of flat) {
              const td = document.createElement('td');
              if (c.align) td.style.textAlign = c.align;
              const f = this.model.formatters.get(c.id); const v = r[c.id];
              td.innerHTML = f ? f(v, r) : (v == null ? '' : String(v));
              tr.appendChild(td);
            }
            tbody_new.appendChild(tr);
          }
          table.tBodies[0]?.replaceWith(tbody_new);
          const label = wrap.querySelector('.dtbl-page-label'); 
          if (label) label.textContent = `Page ${page} / ${total_pages}`;
          const prev = wrap.querySelector('.dtbl-page-prev');
            const next = wrap.querySelector('.dtbl-page-next');
            if (prev) prev.disabled = page <= 1;
            if (next) next.disabled = page >= total_pages;
        }
        this._update_sort_icons();
        if (update_header) this._lock_column_widths?.();
        this._apply_zebra?.();
      }
  
    /** @private — chevrons + badges d’ordre (multi-sort) sur les FEUILLES seulement */
    _update_sort_icons() {
        const wrap  = document.querySelector(`[data-dtbl-id="${this.id}"]`);
        if (!wrap) return;
        const thead = wrap.querySelector('thead');
        if (!thead) return;
    
        // 1) Récupère les FEUILLES (th de la DERNIÈRE ligne) via grille rowSpan/colSpan
        const trs = Array.from(thead.rows);
        if (!trs.length) return;
        const last_row = trs.length - 1;
    
        const grid = [];
        const place = (r,c,th)=>{ (grid[r]??=[])[c]=th; };
        for (let r=0; r<trs.length; r++){
        let c=0;
        for (const th of trs[r].cells){
            const cs = Math.max(1, th.colSpan||1);
            const rs = Math.max(1, th.rowSpan||1);
            while ((grid[r]?.[c]) != null) c++;
            const start=c, end=start+cs-1;
            for (let rr=r; rr<r+rs; rr++) for (let cc=start; cc<=end; cc++) place(rr,cc,th);
            c = end+1;
        }
        }
        const leaf_ths = (grid[last_row]||[]).filter(Boolean); // uniquement les feuilles
    
        // 2) État de tri actif → ordre {key,asc}
        let order = [];
        if (this.mode === 'virtual') {
        order = (this.model.sort_state||[]).map(s => ({ key:s.key, asc:s.asc }));
        } else {
        // en adopt: mappe _adopt_sort_state (index de feuille) vers ces leaf_ths
        order = (this._adopt_sort_state||[]).map(s => {
            const th = leaf_ths[s.index]; // s.index = index de feuille (doit l’être)
            return th ? { key: th.dataset.colId, asc: s.asc } : null;
        }).filter(Boolean);
        }
        const active_count = order.length;
        const index_of = (col_id) => {
        const i = order.findIndex(o => o.key === col_id);
        return i >= 0 ? (i+1) : 0; // 1-based
        };
    
        // 3) Pour chaque FEUILLE: chevron + (éventuel) badge d’ordre
        for (const th of leaf_ths){
        const col_id = th.dataset.colId || '';
    
        // non triable → on nettoie
        if (th.dataset.sort !== 'true') {
            th.querySelector('.dtbl-sort')?.remove();
            th.querySelector('.dtbl-sort-idx')?.remove();
            th.classList.remove('is-sorted');
            th.removeAttribute('data-sort-order');
            continue;
        }
    
        // chevron (↕ / ▲ / ▼)
        let icon = th.querySelector('.dtbl-sort');
        if (!icon){ icon = document.createElement('span'); icon.className='dtbl-sort'; th.appendChild(icon); }
    
        let asc = null;
        if (this.mode === 'virtual') {
            const s = (this.model.sort_state||[]).find(x => x.key === col_id);
            asc = s ? s.asc : null;
        } else {
            // en adopt, l’index de feuille = position dans leaf_ths
            const leaf_index = leaf_ths.indexOf(th);
            const s = (this._adopt_sort_state||[]).find(x => x.index === leaf_index);
            asc = s ? s.asc : null;
        }
        icon.textContent = asc == null ? '↕' : (asc ? '▲' : '▼');
    
        // badge d’ordre (uniquement si >1 colonnes triées)
        const ord = index_of(col_id);
        let badge = th.querySelector('.dtbl-sort-idx');
        if (ord > 0 && active_count > 1){
            if (!badge){ badge = document.createElement('sup'); badge.className='dtbl-sort-idx'; th.appendChild(badge); }
            badge.textContent = String(ord);
            th.classList.add('is-sorted');
            th.dataset.sortOrder = String(ord);
        } else {
            badge?.remove();
            if (asc == null){ th.classList.remove('is-sorted'); th.removeAttribute('data-sort-order'); }
            else { th.classList.add('is-sorted'); th.dataset.sortOrder = '1'; }
        }
        }
    }
  
  

    /** @private — applique l’alternance uniquement sur les lignes visibles */
    _apply_zebra(){
        const table = this._adopt_table || document.querySelector(`[data-dtbl-id="${this.id}"] table`);
        const tbody = table?.tBodies?.[0]; if (!tbody) return;
    
        let vis = 0;
        for (const tr of tbody.rows){
        const hidden = tr.dataset.hidden === 'true' || tr.style.display === 'none';
        tr.classList.remove('dtbl-row-odd','dtbl-row-even');
        if (hidden) continue;
        tr.classList.add((vis % 2) ? 'dtbl-row-even' : 'dtbl-row-odd');
        vis++;
        }
    }

    /**
        * @private
        * Mesure la largeur des <th> (dernière ligne d’entêtes) et écrit un <colgroup>
        * de même longueur pour figer les colonnes. Recalcule si la structure change.
    */
    _lock_column_widths({ include_icons = true, extra_px = 6 } = {}) {
        const table = this._adopt_table || document.querySelector(`[data-dtbl-id="${this.id}"] table`);
        if (!table) return;
        const thead = table.tHead || table.querySelector('thead'); if (!thead) return;
      
        const trs = Array.from(thead.rows);
        if (!trs.length) return;
        const last_row = trs.length - 1;
      
        // --- Construire la grille d’occupation ---
        const grid = [];
        const place = (r, c, th) => { (grid[r] ??= []); grid[r][c] = th; };
        for (let r = 0; r < trs.length; r++) {
          let c = 0;
          for (const th of trs[r].cells) {
            const cs = Math.max(1, th.colSpan || 1);
            const rs = Math.max(1, th.rowSpan || 1);
            while ((grid[r]?.[c]) != null) c++;
            const start = c, end = start + cs - 1;
            for (let rr = r; rr < r + rs; rr++) for (let cc = start; cc <= end; cc++) place(rr, cc, th);
            c = end + 1;
          }
        }
      
        // Feuilles = les TH référencés sur la dernière ligne de la grille
        const leaf_ths = (grid[last_row] || []).filter(Boolean);
      
        // --- Mesure défensive (inclut icônes si hors flux) ---
        const measure_th = (th) => {
          const base = Math.ceil(Math.max(th.scrollWidth || 0, th.getBoundingClientRect().width || 0));
          if (!include_icons) return base + extra_px;
      
          let extra = 0;
          const add_if_out_of_flow = (el) => {
            if (!el) return;
            const cs = getComputedStyle(el);
            const pos = cs.position;
            if (pos === 'absolute' || pos === 'fixed') {
              const r = el.getBoundingClientRect();
              const ml = parseFloat(cs.marginLeft)  || 0;
              const mr = parseFloat(cs.marginRight) || 0;
              extra += Math.ceil(r.width + ml + mr);
            }
          };
          add_if_out_of_flow(th.querySelector('.dtbl-sort'));
          add_if_out_of_flow(th.querySelector('.dtbl-sort-idx'));
          return base + extra + extra_px;
        };
      
        const widths = leaf_ths.map(measure_th);
      
        // --- Écrit/maj le <colgroup> ---
        let cg = table.querySelector('colgroup[data-dtbl-colgroup]');
        if (!cg) {
          cg = document.createElement('colgroup');
          cg.setAttribute('data-dtbl-colgroup', 'true');
          table.insertBefore(cg, table.firstChild); // avant <thead>
        }
        while (cg.children.length < widths.length) cg.appendChild(document.createElement('col'));
        while (cg.children.length > widths.length) cg.removeChild(cg.lastChild);
        widths.forEach((w, i) => { cg.children[i].style.width = `${w}px`; });
      
        table.style.tableLayout = 'fixed';
    }
      
      /** @private */
      _render_toolbar_dom() {
        const wrap = this._wrap || this._adopt_table?.closest('.dtbl-wrap'); if (!wrap) return;
        wrap.querySelector('.dtbl-toolbar')?.remove();
        const frag = document.createElement('div');
        frag.innerHTML = `<div class="dtbl-toolbar">${this.plugins.map(p => p.toolbar_html?.() || '').join('')}</div>`;
        wrap.prepend(frag.firstChild);
        // footer (ex: pagination)
        wrap.querySelector('.dtbl-pager')?.remove();
        const m = this.model.apply(); const slice = m.page_slice();
        const footer = this.plugins.map(p => p.footer_html?.(slice) || '').join('');
        if (footer) wrap.insertAdjacentHTML('beforeend', footer);
      }
  
      /** @private */
      _dispatch_input(e) { for (const p of this.plugins) p.handle_input?.(e); }
      /** @private */
      _dispatch_click(e) { for (const p of this.plugins) p.handle_click?.(e); }
    };
}
  