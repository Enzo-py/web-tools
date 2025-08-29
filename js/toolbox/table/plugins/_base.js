export class TablePlugin {
    attach(table){ this.table = table; return this; }
    toolbar_html(){ return ''; }
    footer_html(){ return ''; }
    handle_input(_e) {}
    handle_click(_e) {}
}