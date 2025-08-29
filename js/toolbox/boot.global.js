// boot.global.js — expose les API en global et exécute les scripts "text/toolbox"
(() => {
    if (window.toolbox_ready) return; // idempotent
  
    const run_toolbox_script = (node) => {
      const s = document.createElement('script');
      if (node.src) s.src = node.src; else s.text = node.textContent;
      // Copie quelques attributs utiles
      if (node.noModule) s.noModule = true;
      if (node.defer) s.defer = true;
      node.replaceWith(s);
    };
  
    (async () => {
      const cm = await import('./context_menu/index.js');
      const et = await import('./editable_text/index.js');
  
      Object.assign(window, cm, et); // ContextMenu, action, EditableText, etc.
      window.toolbox = { context_menu: cm, editable_text: et };
      window.toolbox_ready = true;
  
      // Exécute tous les scripts déjà présents
      document.querySelectorAll('script[type="text/toolbox"]').forEach(run_toolbox_script);
  
      // Si des scripts arrivent plus tard (injection dynamique), on les exécute aussi
      new MutationObserver((muts) => {
        for (const m of muts) for (const n of m.addedNodes || []) {
          if (n.tagName === 'SCRIPT' && n.type === 'text/toolbox') run_toolbox_script(n);
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
    })().catch((e) => {
      console.error('[toolbox boot] failed:', e);
    });
  })();
  