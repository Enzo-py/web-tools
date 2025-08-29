import { ensure_stylesheet } from '../shared/ensure_stylesheet.js';
ensure_stylesheet(new URL('./table.css', import.meta.url));

import { DataTableBase } from './mixins/base.js';
import { with_plugins } from './mixins/plugins.js';
import { with_columns_api } from './mixins/columns_api.js';
import { with_rows_api } from './mixins/rows_api.js';
import { with_dom } from './mixins/dom.js';
import { with_enhance } from './mixins/enhance.js';
import { with_exports } from './mixins/exports.js';

class _DT0 extends DataTableBase {}
class _DT1 extends with_plugins(_DT0) {}
class _DT2 extends with_columns_api(_DT1) {}
class _DT3 extends with_rows_api(_DT2) {}
class _DT4 extends with_dom(_DT3) {}
class _DT5 extends with_enhance(_DT4) {}
export class DataTable extends with_exports(_DT5) {}


// Plugins (leurs fichiers exportent les classes)
import { Search }     from './plugins/search.js'
import { Sort }       from './plugins/sort.js'
import { Pagination } from './plugins/pagination.js'
import { Downloads }  from './plugins/downloads.js'

// Enregistrement + attache statique pour autocomplétion
DataTable.register_plugin('search',     Search)
DataTable.register_plugin('sort',       Sort)
DataTable.register_plugin('pagination', Pagination)
DataTable.register_plugin('downloads',  Downloads)
