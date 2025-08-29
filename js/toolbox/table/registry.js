export class DataTableRegistry {
    static reg = new Map();
    static inited = false;
    static uid(){ return 'dt_'+Math.random().toString(36).slice(2,8)+Date.now().toString(36) }
    static init(){
      if (this.inited) return; this.inited = true;
      document.addEventListener('input', (e)=>{
        const wrap = e.target.closest('[data-dtbl-id]'); if (!wrap) return;
        const inst = this.reg.get(wrap.dataset.dtblId); if (!inst) return;
        inst._dispatch_input(e);
      });
      document.addEventListener('click', (e)=>{
        const wrap = e.target.closest('[data-dtbl-id]'); if (!wrap) return;
        const inst = this.reg.get(wrap.dataset.dtblId); if (!inst) return;
        inst._dispatch_click(e);
      });
    }
}
