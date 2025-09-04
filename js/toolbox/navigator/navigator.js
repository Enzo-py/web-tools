export class Navigator {
    constructor(max_tab_number = -1, max_tab_message = null, open_tab_event = null, delete_event = null) {
      this.tabs = new Map(); // tab_id → { label, button: Element|null, content: Element, hidden, count_towards_limit }
      this.current = null;
      this.max_tab_number = max_tab_number;
      this.max_tab_message = max_tab_message;
      this.tab_count = 0;

      this.delete_event = delete_event;
      this.open_tab_event = open_tab_event;
    }

    draw(target) {
      const root = typeof target === "string" ? document.querySelector(target) : target;
      this.container = document.createElement("div");
      this.container.className = "navigator";

      this.navbar = document.createElement("div");
      this.navbar.className = "navigator-bar";

      this.content_area = document.createElement("div");
      this.content_area.className = "navigator-content";

      this.container.appendChild(this.navbar);
      this.container.appendChild(this.content_area);
      root.appendChild(this.container);
    }

    add(tab_id, tab_name, content, { closable = false, hidden = false, count_towards_limit = true } = {}) {
      if (this.tabs.has(tab_id)) return;

      if (count_towards_limit && this.max_tab_number >= 0 && this.tab_count === this.max_tab_number) {
        if (this.max_tab_message) toast("warning", this.max_tab_message);
        return;
      }

      if (count_towards_limit) this.tab_count += 1;

      let button = null;
      if (!hidden) {
        button = document.createElement("button");
        button.className = "navigator-tab";
        button.id = tab_id;
        button.textContent = tab_name;
        button.addEventListener("click", () => this.open(tab_id));

        if (closable) {
          const close = document.createElement("span");
          close.className = "material-symbols-outlined btn-close";
          close.innerHTML = "close";
          close.addEventListener("click", (event) => {
            event.stopPropagation();
            this.delete(tab_id);
          });
          button.appendChild(close);
        }
        this.navbar.appendChild(button);
      }

      const content_node = document.createElement("div");
      content_node.id = tab_id;
      content_node.style.display = "none";

      if (typeof content === "string") {
        content_node.innerHTML = content;
      } else {
        content_node.appendChild(content.cloneNode(true));
      }
      this.content_area.appendChild(content_node);

      this.tabs.set(tab_id, {
        label: tab_name,
        button,
        content: content_node,
        hidden: !!hidden,
        count_towards_limit: !!count_towards_limit,
      });

      if (!this.current && !hidden) this.open(tab_id);
    }

    add_hidden(tab_id, tab_name, content, opts = {}) {
      return this.add(tab_id, tab_name, content, { ...opts, hidden: true });
    }

    set(tab_id, new_content) {
      const tab = this.tabs.get(tab_id);
      if (!tab) return;

      tab.content.innerHTML = "";
      if (typeof new_content === "string") {
        tab.content.innerHTML = new_content;
      } else {
        tab.content.appendChild(new_content.cloneNode(true));
      }
    }

    open(tab_id) {
      if (!this.tabs.has(tab_id)) {
        console.error(`tab id: <${tab_id}> not found in <${Array.from(this.tabs.keys())}>`);
        return;
      }
      this.open_tab_event?.(tab_id);

      if (this.current && this.tabs.has(this.current)) {
        const current_tab = this.tabs.get(this.current);
        current_tab.button?.classList.remove("active");
        current_tab.content.style.display = "none";
      }

      const tab = this.tabs.get(tab_id);
      tab.button?.classList.add("active");
      tab.content.style.display = "block";
      this.current = tab_id;
    }

    delete(tab_id) {
      const tab = this.tabs.get(tab_id);
      if (!tab) return;

      this.delete_event?.(tab_id);
      tab.button?.remove();
      tab.content.remove();
      this.tabs.delete(tab_id);

      if (tab.count_towards_limit) this.tab_count -= 1;

      if (this.current === tab_id) {
        const next_id = this.tabs.keys().next().value;
        this.current = null;
        if (next_id) this.open(next_id);
      }
    }

    order(tab_id_list) {
      const ordered = [];
      for (const tab_id of tab_id_list) {
        const tab = this.tabs.get(tab_id);
        if (tab?.button) ordered.push(tab.button);
      }
      if (ordered.length) this.navbar.append(...ordered);
    }

    ids({ include_hidden = false } = {}) {
      const out = [];
      for (const [id, t] of this.tabs.entries()) {
        if (include_hidden || !t.hidden) out.push(id);
      }
      return out;
    }

    static from(html_node, { max_tab_number = -1, max_tab_message = null, delete_event = null } = {}) {
      const nav = new Navigator(max_tab_number, max_tab_message, null, delete_event);

      nav.container = html_node;
      if (!nav.container.classList.contains("navigator")) {
        nav.container.classList.add("navigator");
      }
      nav.navbar = nav.container.querySelector(".navigator-bar");
      nav.content_area = nav.container.querySelector(".navigator-content");

      nav.container.querySelectorAll("[data-tab-id]").forEach((el) => {
        const tab_id = el.getAttribute("data-tab-id");
        const tab_name = el.getAttribute("data-tab-name") || tab_id;
        const closable = el.getAttribute("data-closable") === "true";
        const hidden = el.getAttribute("data-hidden") === "true";
        const content_node = el.querySelector(".navigator-tab-content");
        nav.add(tab_id, tab_name, content_node, { closable, hidden });
      });

      return nav;
    }

    print_tabs(tab_ids, { filename = null } = {}) {
      const prev_title = document.title;
      if (filename) document.title = filename;

      const bundle = document.createElement("div");
      bundle.className = "print-bundle";

      for (const id of tab_ids) {
        const tab = this.tabs.get(id);
        if (!tab) continue;

        const page = document.createElement("section");
        page.className = "print-page navigator-content";

        const clone = tab.content.cloneNode(true);
        clone.style.removeProperty("display");
        clone.querySelectorAll('[style*="display: none"]').forEach(el => el.style.removeProperty("display"));

        clone.querySelectorAll("canvas").forEach(c => {
          try {
            const img = new Image();
            img.src = c.toDataURL("image/png");
            img.width = c.width; img.height = c.height;
            c.replaceWith(img);
          } catch { /* no-op */ }
        });
        page.appendChild(clone);
        bundle.appendChild(page);
      }

      document.body.appendChild(bundle);

      const cleanup = () => {
        bundle.remove();
        document.title = prev_title;
        window.removeEventListener("afterprint", cleanup);
      };
      window.addEventListener("afterprint", cleanup);

      setTimeout(() => window.print(), 0);
    }
}
