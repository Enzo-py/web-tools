import { TablePlugin } from './_base.js';

export class Sort extends TablePlugin {
  constructor({ multi = true, require_modifier = false, new_first = true, alt_clears_all = false } = {}) {
    super();
    this.multi = multi;
    this.require_modifier = require_modifier;
    this.new_first = new_first;
    this.alt_clears_all = alt_clears_all;
  }

  handle_click(e) {
    const th = e.target.closest('th[data-col-id]');
    if (!th || th.dataset.sort !== 'true') return;

    const want_append = this.multi && (!this.require_modifier || e.shiftKey || e.metaKey || e.ctrlKey);
    const id = th.dataset.colId;

    if (this.table.mode === 'virtual') {
      if (this.alt_clears_all && e.altKey) { this.table.model.set_sort([]); this.table._render_virtual_body(); this.table._update_sort_icons?.(); return; }

      const state = this._cycle_state(this.table.model.sort_state, id, want_append, this.new_first);
      this.table.model.set_sort(state);
      this.table._render_virtual_body();
      this.table._update_sort_icons?.();

    } else {
      this.table._adopt_sort(th, want_append, { new_first: this.new_first, tri_state: true, alt_clears_all: this.alt_clears_all, alt: e.altKey });
      this.table._update_sort_icons?.();
    }
  }

  _cycle_state(cur_state, id, append, new_first) {
    const cur = cur_state.slice();
    const i = cur.findIndex(s => s.key === id);
    if (!append) {
      if (i < 0) return [{ key: id, asc: true }];
      if (cur[i].asc) { cur[i] = { key: id, asc: false }; return cur; }
      cur.splice(i, 1); return cur;               // off
    }
    if (i < 0) {
      const it = { key: id, asc: true };
      if (new_first) cur.unshift(it); else cur.push(it);
      return cur;
    }
    if (cur[i].asc) cur[i] = { key: id, asc: false };
    else cur.splice(i, 1);                        // off
    if (new_first && i < cur.length && i !== 0) { const [it] = cur.splice(i, 1); cur.unshift(it); }
    return cur;
  }
}
