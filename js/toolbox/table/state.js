/**
 * TableState = source de vérité des données/colonnes + vue dérivée.
 * - Pas de DOM ici.
 * - Public: getters/setters clairs (colonnes, lignes, tri, filtre, pagination).
 * - Privé: tout préfixé par "_".
 */
export class TableState {
  /**
   * @param {{locale?: string}} [opts]
   */
  constructor({ locale } = {}) {
    // Utilisé par l'orchestrateur pour comparer du texte proprement
    this.collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
    // Formatters par colonne: col_id -> (value,row) => string|HTML
    this.formatters = new Map();

    // --- état interne (privé) ---
    this._columns = [];   // arbre de colonnes (groupes + feuilles)
    this._rows = [];   // données brutes
    this._view_rows = [];   // données après filtre/tri
    this._sort_state = [];   // [{ key, asc }]
    this._query = '';   // filtre global en plein texte
    this._page_size = null; // null => pas de pagination
    this._page = 1;    // 1-indexed
  }

  // ---------------------------
  // Colonnes — API publique
  // ---------------------------

  /** Copie profonde de l’arbre de colonnes. */
  get_columns() { return JSON.parse(JSON.stringify(this._columns)); }

  /** Feuilles: [{id,label,type?,sortable?,width?,align?}] */


  /** Remplace toutes les colonnes (arbre possible). */
  set_columns(cols) { this._columns = this._norm_cols(cols || []); return this; }

  /** Patch une feuille par id (align, label, type, sortable, width, …). */
  update_column(id, patch = {}) {
    const c = this.flat_columns().find(x => x.id === id);
    if (!c) throw new Error(`TableState.update_column: unknown column "${id}"`);
    Object.assign(c, patch);
    return this;
  }

  /** Patch de masse: { id: {…}, id2: {…} } */
  set_columns_meta(meta_by_id = {}) {
    const flat = this.flat_columns();
    for (const [id, meta] of Object.entries(meta_by_id)) {
      const c = flat.find(x => x.id === id);
      if (c) Object.assign(c, meta);
    }
    return this;
  }

  /** Toutes les feuilles (ordonnées). */
  flat_columns() {
    const out = [];
    (function walk(list) { list.forEach(c => c.children ? walk(c.children) : out.push(c)); })(this._columns);
    return out;
  }
  get_flat_columns() {
    const flat = this.flat_columns();
      return flat.map(c => ({
        id: c.id,
        label: c.label,
        type: c.type,
        sortable: c.sortable === true,
        width: c.width,
        align: c.align,
        searchable: c.searchable === true
      }));
  }

  /** Profondeur maximum des en-têtes (utile au renderer). */
  header_depth() {
    const depth = (list) => Math.max(0, ...list.map(c => c.children ? 1 + depth(c.children) : 1));
    return depth(this._columns);
  }

  /** Nombre de feuilles sous un nœud. */
  leaf_count(node) {
    if (!node.children) return 1;
    return node.children.reduce((s, ch) => s + this.leaf_count(ch), 0);
  }

  // ---------------------------
  // Données — API publique
  // ---------------------------

  /** Remplace toutes les lignes. */
  set_rows(rows) { this._rows = Array.isArray(rows) ? rows.slice() : []; return this; }

  /** Ajoute une ou plusieurs lignes. */
  add_rows(rows = []) { if (!Array.isArray(rows)) rows = [rows]; this._rows.push(...rows); return this; }

  /** Vide toutes les lignes. */
  clear_rows() { this._rows.length = 0; return this; }

  /** Patch une ligne par index. */
  update_row_at(index, patch = {}) {
    if (index < 0 || index >= this._rows.length) throw new Error('TableState.update_row_at: index out of range');
    Object.assign(this._rows[index], patch);
    return this;
  }

  /** Définit une cellule (ligne, colonne). */
  set_cell_at(index, col_id, value) {
    if (index < 0 || index >= this._rows.length) throw new Error('TableState.set_cell_at: index out of range');
    (this._rows[index] ??= {})[col_id] = value;
    return this;
  }

  /**
   * Récupère les lignes: 'raw' | 'view' | 'page'
   * - raw  : données brutes
   * - view : après filtre/tri
   * - page : tranche paginée courante (après apply())
   */
  get_rows(scope = 'view') {
    this.apply();
    if (scope === 'raw') return this._rows.slice();
    if (scope === 'view') return this._view_rows.slice();
    if (scope === 'page') return this.page_slice().rows.slice();
    throw new Error(`TableState.get_rows: unknown scope "${scope}"`);
  }

  // ---------------------------
  // Filtre / Tri / Pagination
  // ---------------------------

  /** Définit la requête plein-texte (filtrage global). */
  set_query(q) { this._query = String(q || ''); return this; }

  /** Définit la taille de page (null => pas de pagination) et réinitialise la page à 1. */
  set_page_size(n) { this._page_size = n || null; this._page = 1; return this; }

  /** Définit la page courante (1-indexed, bornée). */
  set_page(p) { this._page = Math.max(1, parseInt(p || 1, 10)); return this; }

  /**
   * Ajoute/remplace un critère de tri.
   * @param {string} key  id de colonne
   * @param {boolean} [asc=true]
   * @param {boolean} [append=false] true => multi-tri
   */
  sort_by(key, asc = true, append = false) {
    if (!append) this._sort_state = [];
    this._sort_state.push({ key, asc });
    return this;
  }

  /** Remplace tout l’état de tri: [{key,asc}, …] */
  set_sort(state = []) { this._sort_state = Array.isArray(state) ? state.filter(s => s && s.key) : []; return this; }

  /** Efface tout tri. */
  clear_sort() { this._sort_state = []; return this; }

  /**
   * Applique filtre + tri et calcule la vue (_view_rows).
   * À appeler avant page_slice() si query/tri/rows ont changé.
   */
  apply() {
    const q = this._query.toLowerCase();
    const flat = this.flat_columns();
    const cols = flat.filter(c => c.searchable === true); // <= colonnes fouillées
  
    if (!q) {
      this._view_rows = this._rows.slice();
    } else {
      if (cols.length === 0) {
        // par design: défaut = false => aucune colonne fouillée => aucun match
        this._view_rows = [];
      } else {
        this._view_rows = this._rows.filter(r =>
          cols.some(c => String(r[c.id] ?? '').toLowerCase().includes(q))
        );
      }
    }
  
    // ... (le tri reste inchangé)
    if (this._sort_state.length) {
      const rows = this._view_rows.map((row, idx) => ({ row, idx }));
      const type_of = (id) => (flat.find(c => c.id === id)?.type) || 'text';
      rows.sort((a, b) => {
        for (const s of this._sort_state) {
          const t = type_of(s.key), av = a.row[s.key], bv = b.row[s.key];
          const cmp = this._compare_values(t, av, bv);
          if (cmp) return s.asc ? cmp : -cmp;
        }
        return a.idx - b.idx;
      });
      this._view_rows = rows.map(x => x.row);
    }
  
    return this;
  }

  /** Renvoie la tranche paginée courante (après apply()). */
  page_slice() {
    if (!this._page_size) return { rows: this._view_rows, page: 1, total_pages: 1 };
    const total = Math.max(1, Math.ceil(this._view_rows.length / this._page_size));
    if (this._page > total) this._page = total;
    const start = (this._page - 1) * this._page_size;
    return { rows: this._view_rows.slice(start, start + this._page_size), page: this._page, total_pages: total };
  }

  // ---------------------------
  // Formatters / Exposition lecture
  // ---------------------------

  /** Enregistre un formateur pour une colonne. */
  format(col_id, fn) { this.formatters.set(col_id, fn); return this; }

  // Exposition lecture (compat orchestrateur)
  get sort_state() { return this._sort_state; }
  get page_size() { return this._page_size; }
  get page() { return this._page; }

  // ---------------------------
  // Privé
  // ---------------------------

  /** Normalise l’arbre de colonnes. */
  _norm_cols(cols, depth = 0, parent = null) {
    return cols.map(c => ({
      id: c.id,
      label: c.label ?? c.id,
      type: c.type || 'text',
      sortable: c.sortable !== false,
      searchable: c.searchable === true,   // <--- ici
      width: c.width || null,
      align: c.align || null,
      comparator: c.comparator || null,
      children: c.children ? this._norm_cols(c.children, depth + 1, c) : null,
      _depth: depth,
      _parent: parent
    }));
  }

  /** Compare deux valeurs selon le type. Null/'' en dernier. */
  _compare_values(type, a, b) {
    const an = (a == null || a === ''), bn = (b == null || b === '');
    if (an && bn) return 0;
    if (an) return 1;
    if (bn) return -1;

    if (type === 'number') {
      const na = Number(a), nb = Number(b);
      const aa = Number.isFinite(na) ? na : -Infinity;
      const bb = Number.isFinite(nb) ? nb : -Infinity;
      return aa - bb;
    }
    if (type === 'date') {
      const da = this._coerce_date(a), db = this._coerce_date(b);
      return da - db;
    }
    return this.collator.compare(String(a), String(b));
  }

  /** Parse “best-effort” vers timestamp. */
  _coerce_date(v) {
    if (v instanceof Date) return v.getTime();
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : -8.64e15;
  }
}
