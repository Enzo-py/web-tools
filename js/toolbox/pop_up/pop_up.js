export class PopUp {
    static _id = 0;
  
    constructor({
      content = '',
      backdrop = true,
      backdrop_click_closes = true,
      esc_closes = true,
      extra_backdrop_class = null,   // ex: 'showcase-background'
      buttons = [],                  // [{label, class_name, auto_close=true, on_click}]
      on_open = null,
      on_close = null
    } = {}) {
      this.id = `pop-up-${PopUp._id++}`;
      this.on_open = on_open;
      this.on_close = on_close;
  
      this._wrapper = document.createElement('div');
      this._wrapper.className = 'pop-up-wrapper';
      this._wrapper.id = this.id;
  
      if (backdrop) {
        this._backdrop = document.createElement('div');
        this._backdrop.className = 'pop-up-backdrop';
        this._wrapper.appendChild(this._backdrop);
        if (backdrop_click_closes) this._backdrop.addEventListener('click', () => this.close());
      }
  
      if (extra_backdrop_class) {
        const extra = document.createElement('div');
        extra.className = extra_backdrop_class;
        this._wrapper.appendChild(extra);
      }
  
      this._dialog = document.createElement('div');
      this._dialog.className = 'pop-up';
      this._wrapper.appendChild(this._dialog);
  
      this._message = document.createElement('div');
      this._message.className = 'pop-up-message';
      this._dialog.appendChild(this._message);
  
      this._buttons = document.createElement('div');
      this._buttons.className = 'pop-up-buttons';
      this._dialog.appendChild(this._buttons);
  
      this.set_content(content);
      this.replace_buttons(buttons);
  
      this._on_keydown = (e) => { if (e.key === 'Escape' && esc_closes) this.close(); };
    }
  
    set_content(content) {
      if (content instanceof Node) this._message.replaceChildren(content);
      else this._message.innerHTML = content ?? '';
      return this;
    }
  
    add_button({ label, class_name = '', auto_close = true, on_click = null }) {
      const btn = document.createElement('button');
      if (class_name) btn.className = class_name;
      btn.textContent = label;
      btn.addEventListener('click', () => {
        on_click && on_click();
        if (auto_close) this.close();
      });
      this._buttons.appendChild(btn);
      return this;
    }
  
    replace_buttons(list = []) {
      this._buttons.replaceChildren();
      for (const spec of list) this.add_button(spec);
      return this;
    }
  
    open() {
      document.body.appendChild(this._wrapper);
      document.addEventListener('keydown', this._on_keydown, true);
      this.on_open && this.on_open(this);
      return this;
    }
  
    close() {
      if (!this._wrapper.isConnected) return this;
      document.removeEventListener('keydown', this._on_keydown, true);
      this._wrapper.remove();
      this.on_close && this.on_close(this);
      return this;
    }
  
    // Shortcuts
    static confirm(message, { yes_label = 'Yes', no_label = 'No', on_yes = null, on_no = null } = {}) {
      return new PopUp({
        content: message,
        buttons: [
          { label: yes_label, class_name: 'yes-button', auto_close: true, on_click: on_yes },
          { label: no_label,  class_name: 'no-button',  auto_close: true, on_click: on_no  },
        ]
      });
    }
  
    static next(message, { text = 'Next', on_next = null, backdrop = true, backdrop_click_closes = false, before_open = null } = {}) {
      return new PopUp({
        content: message,
        backdrop,
        backdrop_click_closes,
        buttons: [{ label: text, class_name: 'next-button', auto_close: true, on_click: on_next }],
        on_open: (pop) => { before_open && before_open(pop._dialog); }
      });
    }
  
    static showcase(message) {
      return new PopUp({
        content: message,
        backdrop: true,
        extra_backdrop_class: 'showcase-background'
      });
    }
  }
  