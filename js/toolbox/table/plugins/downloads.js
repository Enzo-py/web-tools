import { TablePlugin } from './_base.js';

export class Downloads extends TablePlugin {
  constructor({
    filename='data',
    default_scope='filtered',      // 'all' | 'filtered' | 'page'
    key_source='label',            // 'label' | 'id' pour entêtes & JSON si json_key_source absent
    json_key_source=null,          // si null => key_source
    path_sep=' / '                 // séparateur d'entête hiérarchique
  } = {}) {
    super();
    this.filename = filename;
    this.default_scope = default_scope;
    this.key_source = key_source;
    this.json_key_source = json_key_source || key_source;
    this.path_sep = path_sep;
  }

  attach(table){ this.table = table; }

  toolbar_html(){
    return `
      <button class="dtbl-btn dtbl-btn-icon dtbl-download" title="Export">
        <span class="material-symbols-outlined">file_download</span>
      </button>`;
  }

  handle_click(e){
    if (!e.target.closest('.dtbl-download')) return;
    this._open_popup();
  }

  _open_popup(){
    const uid='dl_'+Math.random().toString(36).slice(2,8);
    const info=this._gather_info();
    const content = `
      <h2 class="title">Download</h2>
      <div id="${uid}" class="dtbl-dl">
        <div class="dtbl-dl__stats">
          <div><b>Columns:</b> ${info.cols}</div>
          <div><b>Rows (all):</b> ${info.rows_all}</div>
          <div><b>Rows (filtered):</b> ${info.rows_filtered}</div>
          <div><b>Rows (page):</b> ${info.rows_page}</div>
        </div>
        <div class="dtbl-dl__scope">
          <div class="dtbl-dl__legend">Scope</div>
          <label><input type="radio" name="dl-scope" value="all"      ${this.default_scope==='all'?'checked':''}> All rows</label>
          <label><input type="radio" name="dl-scope" value="filtered" ${this.default_scope==='filtered'?'checked':''}> Filtered rows</label>
          <label><input type="radio" name="dl-scope" value="page"     ${this.default_scope==='page'?'checked':''}> Current page</label>
        </div>
        <div class="dtbl-dl__actions">
          <button class="dtbl-dl__btn btn-csv"  data-act="csv"><span class="material-symbols-outlined">table_chart</span> CSV</button>
          <button class="dtbl-dl__btn btn-tsv"  data-act="tsv"><span class="material-symbols-outlined">grid_on</span> TSV</button>
          <button class="dtbl-dl__btn btn-json" data-act="json"><span class="material-symbols-outlined">data_object</span> JSON</button>
          <button class="dtbl-dl__btn btn-md"   data-act="md"><span class="material-symbols-outlined">text_snippet</span> Markdown</button>
          <button class="dtbl-dl__btn btn-cpy"  data-act="copy"><span class="material-symbols-outlined">content_copy</span> Copy</button>
        </div>
      </div>`;
    new PopUp({ title:'Export data', content, actions:[{label:'Close', role:'close'}] }).open();

    const root=document.getElementById(uid); if(!root) return;
    root.addEventListener('click', ev=>{
      const btn=ev.target.closest('.dtbl-dl__btn'); if(!btn) return;
      const scope = root.querySelector('input[name="dl-scope"]:checked')?.value || this.default_scope;
      const fmt = btn.dataset.act;
      if (fmt==='csv') this._export_csv(scope);
      else if (fmt==='tsv') this._export_tsv(scope);
      else if (fmt==='json') this._export_json(scope);
      else if (fmt==='md') this._export_md(scope);
      else if (fmt==='copy') this._copy_csv(scope);
    });
  }

  _gather_info(){
    const leaves=this.table.model.get_flat_columns();
    const cols=leaves.length;
    if (this.table.mode==='virtual'){
      return {
        cols,
        rows_all: this.table.model.get_rows('raw').length,
        rows_filtered: this.table.model.get_rows('view').length,
        rows_page: this.table.model.get_rows('page').length
      };
    }
    const tbody=this.table._adopt_table.tBodies[0];
    const all=tbody.rows.length;
    const filtered=[...tbody.rows].filter(r=>r.dataset.hidden!=='true').length;
    const page=[...tbody.rows].filter(r=>r.dataset.hidden!=='true' && r.style.display!=='none').length;
    return { cols, rows_all:all, rows_filtered:filtered, rows_page:page };
  }

  // ---------- Exports hiérarchiques ----------

  _export_csv(scope){
    const { headers, values } = this._collect_flat(scope, /*formatted=*/true);
    const csv = this._to_delim(headers, values, ',');
    this._download(`${this.filename}.csv`, csv, 'text/csv;charset=utf-8');
  }

  _export_tsv(scope){
    const { headers, values } = this._collect_flat(scope, /*formatted=*/true);
    const tsv = this._to_delim(headers, values, '\t');
    this._download(`${this.filename}.tsv`, tsv, 'text/tab-separated-values;charset=utf-8');
  }

  _export_md(scope){
    const { headers, values } = this._collect_flat(scope, /*formatted=*/true);
    const esc_bar = s => String(s).replace(/\|/g,'\\|');
    const header_line = `| ${headers.map(esc_bar).join(' | ')} |`;
    const sep_line = `| ${headers.map(()=> '---').join(' | ')} |`;
    const body = values.map(r => `| ${r.map(v => esc_bar(v)).join(' | ')} |`).join('\n');
    const md = `${header_line}\n${sep_line}\n${body}\n`;
    this._download(`${this.filename}.md`, md, 'text/markdown;charset=utf-8');
  }

  async _copy_csv(scope){
    const { headers, values } = this._collect_flat(scope, /*formatted=*/true);
    const csv = this._to_delim(headers, values, ',');
    try { await navigator.clipboard.writeText(csv); }
    catch {
      const ta=document.createElement('textarea');
      ta.value=csv; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); } finally{ ta.remove(); }
    }
  }

  _export_json(scope){
    const { paths, values } = this._collect_for_json(scope);
    const arr = values.map(vals => this._nest_row(paths, vals));
    const json = JSON.stringify(arr, null, 2);
    this._download(`${this.filename}.json`, json, 'application/json;charset=utf-8');
  }

  // ---------- Collecte ----------

  /**
   * Collecte plate (entêtes hiérarchiques jointes) pour CSV/TSV/MD/Copy.
   * @returns {{headers:string[], values:string[][]}}
   */
  _collect_flat(scope, formatted){
    const tree = this.table.model.get_columns();
    const leaves = this.table.model.get_flat_columns();
    const paths = this._leaf_paths(tree, this.key_source);
    const headers = paths.map(p => p.join(this.path_sep));

    // valeurs
    if (this.table.mode==='virtual'){
      const m=this.table.model; m.apply();
      let src;
      if (scope==='all') src = m.get_rows('raw');
      else if (scope==='filtered') src = m.get_rows('view');
      else src = m.get_rows('page');

      const fmt=m.formatters;
      const values = src.map(r => leaves.map(c => {
        const v = r[c.id];
        if (!formatted) return v;
        const f = fmt.get(c.id);
        return f ? f(v,r) : (v==null ? '' : v);
      }));
      return { headers, values };
    }

    // adopt → DOM
    const tbody=this.table._adopt_table.tBodies[0];
    let trs;
    if (scope==='all') trs=[...tbody.rows];
    else if (scope==='filtered') trs=[...tbody.rows].filter(r=>r.dataset.hidden!=='true');
    else trs=[...tbody.rows].filter(r=>r.dataset.hidden!=='true' && r.style.display!=='none');

    const values = trs.map(tr => {
      const cells=[...tr.cells];
      return leaves.map((_,i)=>(cells[i]?.textContent?.trim() ?? ''));
    });
    return { headers, values };
  }

  /**
   * Collecte valeurs + chemins pour JSON imbriqué (brut côté virtual).
   * @returns {{paths:string[][], values:any[][]}}
   */
  _collect_for_json(scope){
    const tree = this.table.model.get_columns();
    const leaves = this.table.model.get_flat_columns();
    const paths = this._leaf_paths(tree, this.json_key_source);

    if (this.table.mode==='virtual'){
      const m=this.table.model; m.apply();
      let src;
      if (scope==='all') src = m.get_rows('raw');
      else if (scope==='filtered') src = m.get_rows('view');
      else src = m.get_rows('page');

      // valeurs brutes pour JSON
      const values = src.map(r => leaves.map(c => r[c.id]));
      return { paths, values };
    }

    // adopt → valeur = texte DOM
    const tbody=this.table._adopt_table.tBodies[0];
    let trs;
    if (scope==='all') trs=[...tbody.rows];
    else if (scope==='filtered') trs=[...tbody.rows].filter(r=>r.dataset.hidden!=='true');
    else trs=[...tbody.rows].filter(r=>r.dataset.hidden!=='true' && r.style.display!=='none');

    const values = trs.map(tr => {
      const cells=[...tr.cells];
      return leaves.map((_,i)=>(cells[i]?.textContent?.trim() ?? ''));
    });
    return { paths, values };
  }

  _leaf_paths(tree, mode){
    const out=[];
    const key_of_leaf = (leaf)=> (mode==='id' ? (leaf.id ?? leaf.label ?? 'col') : (leaf.label ?? leaf.id ?? 'col'));
    const walk=(nodes, prefix=[])=>{
      for(const n of nodes||[]){
        if (n.children && n.children.length) {
          const name = (mode==='id' ? (n.id ?? n.label ?? '') : (n.label ?? n.id ?? ''));
          walk(n.children, name ? [...prefix, name] : [...prefix]);
        } else {
          out.push([...prefix, key_of_leaf(n)]);
        }
      }
    };
    walk(tree, []);
    return out;
  }

  _nest_row(paths, values){
    const obj={};
    for (let i=0;i<paths.length;i++){
      const path=paths[i]; let cur=obj;
      for (let j=0;j<path.length-1;j++){
        const k=path[j] ?? '';
        if (!(k in cur) || typeof cur[k] !== 'object' || cur[k] === null) cur[k]={};
        cur=cur[k];
      }
      const leaf_key=path[path.length-1] ?? 'value';
      cur[leaf_key]=values[i];
    }
    return obj;
  }

  // ---------- utils ----------

  _to_delim(headers, rows, sep){
    const esc = s => { s = s == null ? '' : String(s); return /[\"\n,]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
    const head_line = headers.map(esc).join(sep);
    const body = rows.map(r => r.map(v => esc(v)).join(sep)).join('\n');
    return `${head_line}\n${body}`;
  }

  _download(filename, text, type){
    const fn=this.table.constructor._download_blob;
    if (typeof fn==='function'){ this.table.constructor._download_blob(text, filename, type); return; }
    const blob=new Blob([text],{type}); const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),0);
  }
}
