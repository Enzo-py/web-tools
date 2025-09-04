export class Toast {
    static type = Object.freeze({
        info: 'info',
        success: 'success',
        warning: 'warning',
        error: 'error'
    });

    static _ensure() {
        let c = document.getElementById('toast-container');
        if (!c) {
            c = document.createElement('div');
            c.id = 'toast-container';
            document.body.appendChild(c);
        }
        return c;
    }

    static _make(type, message, duration = 3000, opts = {}) {
        const container = this._ensure();
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');

        if (opts.html) el.innerHTML = message;
        else el.textContent = message;

        container.appendChild(el);
        requestAnimationFrame(() => el.classList.add('active'));

        const close = () => {
            el.classList.remove('active');
            el.addEventListener('transitionend', () => el.remove(), { once: true });
        };

        const t = setTimeout(close, duration);
            if (opts.pauseOnHover) {
            el.addEventListener('mouseenter', () => clearTimeout(t), { once: true });
        }

        return { el, close };
    }

    static clear() {
        const c = document.getElementById('toast-container');
        if (c) c.innerHTML = '';
    }

    // Aliases
    static info(message, duration, opts) {
        return this._make(this.type.info, message, duration, opts);
    }
    static success(message, duration, opts) {
        return this._make(this.type.success, message, duration, opts);
    }
    static warning(message, duration, opts) {
        return this._make(this.type.warning, message, duration, opts);
    }
    static error(message, duration, opts) {
        return this._make(this.type.error, message, duration, opts);
    }
}
