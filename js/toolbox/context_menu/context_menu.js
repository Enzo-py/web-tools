    // ---------- Base item ----------
export class MenuItem {
    visible(ctx){ return true }
    enabled(ctx){ return true }
    render(_ctx, _menu){ throw new Error('implement render()') }
}

    // ---------- Items ----------
export class ActionItem extends MenuItem {
    constructor({ label, on_click, icon_html=null, visible=null, enabled=null, danger=false }) {
        super();
        this.label = label;
        this.on_click = on_click;
        this.icon_html = icon_html;
        this.danger = !!danger;
        if (visible) this.visible = visible;
        if (enabled) this.enabled = enabled;
    }
    render(ctx, menu){
        const el = document.createElement('div');
        el.className = 'context-menu__item' + (this.danger ? ' context-menu__item--danger' : '');
        el.setAttribute('role','menuitem');
        el.innerHTML = `${this.icon_html ? `<span class="context-menu__icon">${this.icon_html}</span>` : ''}<span class="context-menu__label">${this.label}</span>`;
        if (this.enabled(ctx)) {
        el.addEventListener('click', (e) => { e.stopPropagation(); menu.close(); this.on_click?.(ctx); });
        } else {
        el.setAttribute('aria-disabled','true');
        }
        return el;
    }
}

export class CheckboxItem extends MenuItem {
    constructor({ label, get_checked, on_toggle, visible=null, enabled=null }) {
        super();
        this.label = label;
        this.get_checked = get_checked;
        this.on_toggle = on_toggle;
        if (visible) this.visible = visible;
        if (enabled) this.enabled = enabled;
    }
    render(ctx, menu){
        const checked = !!(this.get_checked?.(ctx));
        const el = document.createElement('div');
        el.className = 'context-menu__item';
        el.setAttribute('role','menuitemcheckbox');
        el.setAttribute('aria-checked', String(checked));
        el.innerHTML = `<span class="context-menu__label">${this.label}</span><span class="context-menu__check">${checked?'✓':''}</span>`;
        if (this.enabled(ctx)) {
        el.addEventListener('click', (e) => { e.stopPropagation(); this.on_toggle?.(!checked, ctx); menu.close(); });
        } else {
        el.setAttribute('aria-disabled','true');
        }
        return el;
    }
    }

export class SeparatorItem extends MenuItem {
    render(){
        const el = document.createElement('div');
        el.className = 'context-menu__sep';
        el.setAttribute('role','separator');
        return el;
    }
}

    // ---------- Menu ----------
export class ContextMenu {
    constructor({
        activation = 'contextmenu',      // string | string[]
        mode = 'always',                 // 'always' | 'selector'
        selector = null,                 // when mode === 'selector'
        container = document,
        items = [],
        context_fn = null                // (event, target) => extra ctx
    } = {}) {
        this.activation = activation;
        this.mode = mode;
        this.selector = selector;
        this.container = container;
        this.items = items;
        this.context_fn = context_fn;
        this.menu_el = this._create_root();
        this.is_open = false;
        this._bind();
    }

    set_items(items){ this.items = items ?? []; }
    add_item(item){ this.items.push(item); }
    items_list(list=[]){ for (const it of list) this.add_item(it); return this; }
    action(label, on_click, opts={}){ this.add_item(new ActionItem({ label, on_click, ...(opts||{}) })); return this }
    check(label, get_checked, on_toggle, opts={}){ this.add_item(new CheckboxItem({ label, get_checked, on_toggle, ...(opts||{}) })); return this }
    sep(){ this.add_item(new SeparatorItem()); return this }

    open_for_event(ev){
        const target = this._resolve_target(ev);
        if (!target) return;
        ev.preventDefault?.();
        ev.stopPropagation?.();
        const ctx = this._build_ctx(ev, target);
        this._render_items(ctx);
        this._open_at(ev.clientX ?? 0, ev.clientY ?? 0);
    }

    open_at(x, y, ctx = {}){ this._render_items(ctx); this._open_at(x, y); }

    close(){
        if (!this.is_open) return;
        this.is_open = false;
        this.menu_el.style.display = 'none';
        document.removeEventListener('click', this._on_doc_click, true);
        document.removeEventListener('keydown', this._on_doc_key, true);
        window.removeEventListener('resize', this._on_win_resize, true);
        window.removeEventListener('scroll', this._on_win_resize, true);
    }

    destroy(){ this.close(); this.menu_el.remove(); this._unbind(); }

    // ----- internals -----
    _create_root(){
        const el = document.createElement('div');
        el.className = 'context-menu';
        el.style.display = 'none';
        el.setAttribute('role','menu');
        document.body.appendChild(el);
        return el;
    }

    _bind(){
        const types = Array.isArray(this.activation) ? this.activation : [this.activation];
        this._on_trigger = (ev) => this.open_for_event(ev);
        for (const t of types) this.container.addEventListener(t, this._on_trigger);
    }

    _unbind(){
        const types = Array.isArray(this.activation) ? this.activation : [this.activation];
        if (this._on_trigger) for (const t of types) this.container.removeEventListener(t, this._on_trigger);
    }

    _resolve_target(ev){
        if (this.mode === 'always') return ev.target;
        if (this.mode === 'selector' && this.selector) return ev.target.closest(this.selector);
        return null;
    }

    _build_ctx(ev, target){
        return {
        event: ev,
        target,
        data: target?.dataset ?? {},
        ...(this.context_fn ? (this.context_fn(ev, target) || {}) : {})
        };
    }

    _render_items(ctx){
        this.menu_el.innerHTML = '';
        for (const item of this.items){
        if (!item.visible(ctx)) continue;
        const node = item.render(ctx, this);
        this.menu_el.appendChild(node);
        }
        if (!this.menu_el.childElementCount){
        const empty = document.createElement('div');
        empty.className = 'context-menu__item';
        empty.textContent = 'No actions';
        empty.setAttribute('aria-disabled','true');
        this.menu_el.appendChild(empty);
        }
    }

    _open_at(x, y){
        this.menu_el.style.display = 'block';
        this.menu_el.style.left = '0px';
        this.menu_el.style.top = '0px';
        const { width, height } = this.menu_el.getBoundingClientRect();
        const vw = document.documentElement.clientWidth;
        const vh = document.documentElement.clientHeight;
        const px = Math.min(x, vw - width - 4);
        const py = Math.min(y, vh - height - 4);
        this.menu_el.style.left = `${Math.max(4, px)}px`;
        this.menu_el.style.top  = `${Math.max(4, py)}px`;
        this.is_open = true;

        this._on_doc_click = (e) => { if (!this.menu_el.contains(e.target)) this.close(); };
        this._on_doc_key = (e) => { if (e.key === 'Escape') this.close(); };
        this._on_win_resize = () => this.close();
        document.addEventListener('click', this._on_doc_click, true);
        document.addEventListener('keydown', this._on_doc_key, true);
        window.addEventListener('resize', this._on_win_resize, true);
        window.addEventListener('scroll', this._on_win_resize, true);
    }
}
