export class EditableText {
    static _reg = new Map();
    static _inited = false;
    static _esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
    static _uid(){return 'et_'+Math.random().toString(36).slice(2,8)+Date.now().toString(36)}
  
    constructor({ value, tag='h2', id=null, on_save=null, on_cancel=null }){
      this.id = id || EditableText._uid();
      this.value = value ?? '';
      this.tag = tag;
      this.on_save = on_save;
      this.on_cancel = on_cancel;
      EditableText._reg.set(this.id, this);
      EditableText.init();
    }
  
    toString(){
      const v = EditableText._esc(this.value);
      return `<div class="editable-text" data-editable-id="${this.id}">
        <${this.tag} class="view">${v}</${this.tag}>
        <input class="edit" type="text" value="${v}">
      </div>`;
    }
  
    static init(){
      if (EditableText._inited) return;
      EditableText._inited = true;
  
      document.addEventListener('dblclick', (e) => {
        const root = e.target.closest('.editable-text');
        if (!root) return;
        const input_el = root.querySelector('.edit');
        const view_el  = root.querySelector('.view');
        const initial = view_el.textContent.trim();
        root.setAttribute('data-initial', initial);
        input_el.value = initial;
        root.classList.add('is-editing');
        input_el.size = Math.max(1, input_el.value.length);
        input_el.focus(); input_el.select();
      });
  
      document.addEventListener('keydown', (e) => {
        if (!e.target.matches('.editable-text.is-editing .edit')) return;
        const root = e.target.closest('.editable-text');
        if (e.key === 'Enter'){ e.preventDefault(); EditableText._commit(root); }
        else if (e.key === 'Escape'){ e.preventDefault(); EditableText._cancel(root); }
        else if (e.key.length === 1){
          const input_el = root.querySelector('.edit');
          queueMicrotask(() => input_el.size = Math.max(1, input_el.value.length));
        }
      });
  
      document.addEventListener('blur', (e) => {
        if (!e.target.matches('.editable-text.is-editing .edit')) return;
        EditableText._commit(e.target.closest('.editable-text'));
      }, true);
    }
  
    static async _commit(root){
      if (!root || !root.classList.contains('is-editing')) return;
      const input_el = root.querySelector('.edit');
      const view_el  = root.querySelector('.view');
      const inst     = EditableText._reg.get(root.getAttribute('data-editable-id'));
      const old_val  = root.getAttribute('data-initial') ?? view_el.textContent.trim();
      const new_val  = (input_el.value || '').trim();
  
      root.classList.remove('is-editing');
      if (!new_val || new_val === old_val){ input_el.value = old_val; return; }
  
      const prev = view_el.textContent;
      view_el.textContent = new_val;
      try{
        if (inst?.on_save){
          const r = inst.on_save(new_val, inst);
          if (r && typeof r.then === 'function') await r;
        }
        if (inst) inst.value = new_val;
      }catch(err){
        view_el.textContent = prev;
        input_el.value = prev;
        console.error('editable_text save failed:', err);
      }
    }
  
    static _cancel(root){
      if (!root) return;
      const input_el = root.querySelector('.edit');
      const view_el  = root.querySelector('.view');
      const inst     = EditableText._reg.get(root.getAttribute('data-editable-id'));
      input_el.value = root.getAttribute('data-initial') ?? view_el.textContent.trim();
      root.classList.remove('is-editing');
      try{ inst?.on_cancel?.(inst); }catch(_){}
    }
}