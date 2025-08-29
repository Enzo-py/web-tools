import { TablePlugin } from './_base.js';

export class Pagination extends TablePlugin {
  constructor({ page_size = 10 } = {}) {
    super();
    this.page_size = page_size;
  }

  attach(table) {
    super.attach(table);
    // Toujours fixer la page_size (virtual & adopt)
    table.model.set_page_size(this.page_size);
    if (table.mode !== 'virtual') {
      table._adopt_page = 1;
      table._apply_adopt_pagination?.();
    }
    return this;
  }

  toolbar_html() { return ''; }

  footer_html() {
    if (this.table.mode === 'virtual') {
      const { page, total_pages } = this.table.model.apply().page_slice();
      return this._pager_html(page, total_pages);
    } else {
      const { total_pages } = this.table._adopt_page_info();
      const page = Math.max(1, Math.min(total_pages, this.table._adopt_page || 1));
      return this._pager_html(page, total_pages);
    }
  }

  handle_click(e) {
    const btn = e.target.closest('.dtbl-page-prev, .dtbl-page-next');
    if (!btn || btn.disabled) return;
    const delta = btn.classList.contains('dtbl-page-prev') ? -1 : +1;

    if (this.table.mode === 'virtual') {
      const { total_pages } = this.table.model.apply().page_slice();
      const cur = this.table.model.page || 1;
      const next = Math.max(1, Math.min(total_pages, cur + delta));
      this.table.model.set_page(next);
      this.table._render_virtual_body();
    } else {
      const { total_pages } = this.table._adopt_page_info();
      const cur = this.table._adopt_page || 1;
      this.table._adopt_page = Math.max(1, Math.min(total_pages, cur + delta));
      this.table._apply_adopt_pagination();
    }
  }

  _pager_html(page, total) {
    const prev_disabled = page <= 1 ? 'disabled' : '';
    const next_disabled = page >= total ? 'disabled' : '';
    return `
      <div class="dtbl-pager">
        <button class="dtbl-page-prev" ${prev_disabled} aria-label="Previous page">◀</button>
        <span class="dtbl-page-label">Page ${page} / ${total}</span>
        <button class="dtbl-page-next" ${next_disabled} aria-label="Next page">▶</button>
      </div>`;
  }
}
