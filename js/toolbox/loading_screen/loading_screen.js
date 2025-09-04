export class LoadingScreen {
  static ROOT_ID   = 'loading-screen';
  static STEPS_ID  = 'loading-steps';
  static DETAIL_ID = 'loading-detail';

  static #root; static #steps; static #detail;

  static #ensure() {
    if (this.#root && document.body.contains(this.#root)) return;

    let root = document.getElementById(this.ROOT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = this.ROOT_ID;

      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      root.appendChild(spinner);

      const steps = document.createElement('div');
      steps.id = this.STEPS_ID;
      root.appendChild(steps);

      const detail = document.createElement('div');
      detail.id = this.DETAIL_ID;
      root.appendChild(detail);

      document.body.appendChild(root);
    }
    this.#root   = root;
    this.#steps  = root.querySelector('#' + this.STEPS_ID);
    this.#detail = root.querySelector('#' + this.DETAIL_ID);
  }

  static show() {
    this.#ensure();
    this.#root.classList.add('active');
  }

  static hide() {
    this.#ensure();
    this.#root.classList.remove('active');
  }

  /**
   * content: { main_steps?: {title:string, progress?:number, info?:string}[], detail?: Record<string, any> }
   */
  static update(content = {}) {
    this.#ensure();

    const steps = Array.isArray(content.main_steps) ? content.main_steps : [];
    const detail = content.detail && typeof content.detail === 'object' ? content.detail : {};

    if (this.#steps) this.#updateSteps(steps);
    if (this.#detail) this.#updateDetail(detail);
  }

  static #updateSteps(steps) {
    const container = this.#steps;

    // Index existants par titre
    const current = Array.from(container.querySelectorAll('.loading-step'));
    const byTitle = new Map(current.map(el => [el.dataset.title || el.querySelector('.loading-step-title')?.textContent || '', el]));

    // Retrait des steps obsolètes
    current.forEach(el => {
      const t = el.dataset.title || el.querySelector('.loading-step-title')?.textContent || '';
      if (!steps.find(s => s.title === t)) el.remove();
    });

    // Ajout / mise à jour
    steps.forEach(s => {
      const title = String(s.title ?? '');
      let el = byTitle.get(title);
      if (!el) {
        el = document.createElement('div');
        el.className = 'loading-step';
        el.dataset.title = title;

        const t = document.createElement('div');
        t.className = 'loading-step-title';
        el.appendChild(t);

        const p = document.createElement('progress');
        p.className = 'loading-step-progress';
        p.max = 1;
        el.appendChild(p);

        const i = document.createElement('div');
        i.className = 'loading-step-info';
        el.appendChild(i);

        container.appendChild(el);
      }

      el.dataset.title = title;
      el.querySelector('.loading-step-title').textContent = title;
      el.querySelector('.loading-step-progress').value = Number(s.progress ?? 0);
      el.querySelector('.loading-step-info').textContent = String(s.info ?? '');
    });
  }

  static #updateDetail(detail) {
    const container = this.#detail;
    container.innerHTML = '';
    Object.entries(detail).forEach(([k, v]) => {
      const div = document.createElement('div');
      div.className = 'loading-detail-item';
      div.textContent = `${k}: ${v}`;
      container.appendChild(div);
    });
  }
}