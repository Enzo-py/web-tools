/* ---------- Renderer (virtual mode) ---------- */
export class TableRenderer {
    constructor(table){ this.table = table; }
    toolbar_html(){
      return `<div class="dtbl-toolbar">${
        this.table.plugins.map(p=>p.toolbar_html?.()||'').join('')
      }</div>`;
    }
    table_html(){
      const m = this.table.model.apply();
      const flat = m.flat_columns();
      const depth = m.header_depth();
      const head_rows=[];
      (function build(list, lvl=0, self){
        head_rows[lvl] ??= [];
        list.forEach(c=>{
          const has=!!c.children;
          head_rows[lvl].push({
            label:c.label, id:has?null:c.id, colspan:has?self.leaf_count(c):1,
            rowspan:has?1:(depth-lvl), align:c.align, sortable:c.sortable!==false
          });
          if (has) build(c.children, lvl+1, self);
        });
      })(m.columns, 0, m);
  
      const slice = m.page_slice();
  
      let html = `<table class="dtbl ${this.table.opts.sticky_header?'dtbl-sticky':''}"><thead>`;
      for (const row of head_rows){
        html+='<tr>';
        for (const c of row){
          const attrs=[];
          if (c.colspan>1) attrs.push(`colspan="${c.colspan}"`);
          if (c.rowspan>1) attrs.push(`rowspan="${c.rowspan}"`);
          if (c.id) attrs.push(`data-col-id="${c.id}"`);
          if (c.align) attrs.push(`style="text-align:${c.align}"`);
          html += `<th ${attrs.join(' ')}>${c.label}${c.id&&c.sortable?'<span class="dtbl-sort">↕</span>':''}</th>`;
        }
        html+='</tr>';
      }
      html+='</thead><tbody>';
      for (const r of slice.rows){
        html+='<tr>';
        for (const c of flat){
          const v = r[c.id];
          const f = this.table.model.formatters.get(c.id);
          const out = f ? f(v, r) : (v==null?'':String(v));
          html += `<td${c.align?` style="text-align:${c.align}"`:''}>${out}</td>`;
        }
        html+='</tr>';
      }
      html+='</tbody></table>';
      // footer toolbars (e.g. pagination)
      html += this.table.plugins.map(p=>p.footer_html?.(slice) || '').join('');
      return html;
    }
  }