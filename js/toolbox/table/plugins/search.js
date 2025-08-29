import { TablePlugin } from './_base.js'


export class Search extends TablePlugin {
    constructor({ placeholder='Search…', debounce_ms=120 }={}){ super(); this.placeholder=placeholder; this.debounce_ms=debounce_ms; }
    toolbar_html(){ return `<input type="search" class="dtbl-search form-input" placeholder="${this.placeholder}">`; }
    handle_input(e){
      if (!e.target.matches('.dtbl-search')) return;
      clearTimeout(this._t);
      this._t=setTimeout(()=>{
        const q = e.target.value||'';
        if (this.table.mode==='virtual'){ this.table.model.set_query(q); this.table._render_virtual_body(); }
        else { this.table._adopt_filter(q); }
      }, this.debounce_ms);
    }
}