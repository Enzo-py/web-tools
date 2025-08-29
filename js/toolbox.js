function toast(type, message, time=3000) {
    var toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.remove();
    }, time);
}

let UNIQUE_ID = 0;

function pop_up_confirm(message, callback) {
    var pop_up_wrapper = document.createElement('div');
    pop_up_wrapper.classList.add('pop-up-wrapper');
    var pop_up_background = document.createElement('div');
    pop_up_background.classList.add('pop-up-background');
    var pop_up = document.createElement('div');
    pop_up.classList.add('pop-up');

    pop_up_wrapper.setAttribute('id', 'pop-up-' + UNIQUE_ID);
    UNIQUE_ID++;

    var pop_up_message = document.createElement('div');
    pop_up_message.classList.add('pop-up-message');
    pop_up_message.innerHTML = message;

    var pop_up_buttons = document.createElement('div');
    pop_up_buttons.classList.add('pop-up-buttons');
    var yes_button = document.createElement('button');
    yes_button.classList.add('yes-button');
    yes_button.innerHTML = 'Yes';
    yes_button.onclick = function() {
        callback();
        if (!callback) pop_up_wrapper.remove();
    };

    var no_button = document.createElement('button');
    no_button.classList.add('no-button');
    no_button.innerHTML = 'No';
    no_button.onclick = function() {
        pop_up_wrapper.remove();
    };

    pop_up_buttons.appendChild(yes_button);
    pop_up_buttons.appendChild(no_button);

    pop_up.appendChild(pop_up_message);
    pop_up.appendChild(pop_up_buttons);

    pop_up_wrapper.appendChild(pop_up_background);
    pop_up_wrapper.appendChild(pop_up);

    document.body.appendChild(pop_up_wrapper);

    // pop_up_background.onclick = function() {
    //     pop_up_wrapper.remove();
    // };

    // set pop_up on the middle
    var pop_up_height = pop_up.clientHeight;
    var pop_up_width = pop_up.clientWidth;
    pop_up.style.top = 'calc(50% - ' + pop_up_height / 2 + 'px)';
    pop_up.style.left = 'calc(50% - ' + pop_up_width / 2 + 'px)';

    return pop_up_wrapper;
}

function pop_up_next(message, callback, no_background, text_btn='Next', call_before_draw= pop_up => {}) {
    var pop_up_wrapper = document.createElement('div');
    pop_up_wrapper.classList.add('pop-up-wrapper');
    var pop_up_background = document.createElement('div');
    pop_up_background.classList.add('pop-up-background');
    var pop_up = document.createElement('div');
    pop_up.classList.add('pop-up');

    pop_up_wrapper.setAttribute('id', 'pop-up-' + UNIQUE_ID);
    UNIQUE_ID++;

    var pop_up_message = document.createElement('div');
    pop_up_message.classList.add('pop-up-message');
    pop_up_message.innerHTML = message;

    var pop_up_buttons = document.createElement('div');
    pop_up_buttons.classList.add('pop-up-buttons');
    var next_button = document.createElement('button');
    next_button.classList.add('next-button');
    next_button.innerHTML = text_btn;
    next_button.onclick = function() {
        pop_up_wrapper.remove();
        callback();
    };

    pop_up_buttons.appendChild(next_button);

    pop_up.appendChild(pop_up_message);
    pop_up.appendChild(pop_up_buttons);

    if (no_background === undefined || !no_background)
        pop_up_wrapper.appendChild(pop_up_background);
    pop_up_wrapper.appendChild(pop_up);

    document.body.appendChild(pop_up_wrapper);

    // pop_up_background.onclick = function() {
    //     pop_up_wrapper.remove();
    // };

    // set pop_up on the middle
    call_before_draw(pop_up)
    var pop_up_height = pop_up.clientHeight;
    var pop_up_width = pop_up.clientWidth;
    pop_up.style.top = 'calc(50% - ' + pop_up_height / 2 + 'px)';
    pop_up.style.left = 'calc(50% - ' + pop_up_width / 2 + 'px)';

    return pop_up_wrapper;
}

function pop_up_showcase(message) {
    var pop_up_wrapper = document.createElement('div');
    pop_up_wrapper.classList.add('pop-up-wrapper');
    var showcase_background = document.createElement('div');
    showcase_background.classList.add('showcase-background');
    var pop_up = document.createElement('div');
    pop_up.classList.add('pop-up');

    var background = document.createElement('div');
    background.classList.add('pop-up-background');
    pop_up_wrapper.appendChild(background);

    pop_up_wrapper.setAttribute('id', 'pop-up-' + UNIQUE_ID);
    UNIQUE_ID++;

    var pop_up_message = document.createElement('div');
    pop_up_message.classList.add('pop-up-message');
    pop_up_message.innerHTML = message;

    pop_up.appendChild(pop_up_message);

    pop_up_wrapper.appendChild(pop_up);
    pop_up_wrapper.appendChild(showcase_background);

    document.body.appendChild(pop_up_wrapper);

    // set pop_up on the middle
    var pop_up_height = pop_up.clientHeight;
    var pop_up_width = pop_up.clientWidth;
    pop_up.style.top = 'calc(50% - ' + pop_up_height / 2 + 'px)';
    pop_up.style.left = 'calc(50% - ' + pop_up_width / 2 + 'px)';

    return pop_up_wrapper;
}

function close_pop_up() {
    var pop_ups = document.getElementsByClassName('pop-up-wrapper');
    for (var i = 0; i < pop_ups.length; i++) {
        pop_ups[i].remove();
    }
}

function sql_to_html(sql) {
    const keywordRegex = /\b(WITH|SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|ON|AND|OR|LIMIT|AS|IS NOT NULL|IS NULL|LIKE|IN|NOT IN|GROUP BY|ORDER BY|HAVING)\b/gi;
    const commentRegex = /(--.*?$)/gm;

    // Escape HTML
    sql = sql.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace('\n', ' ').replace('\t', ' ')

    // Highlight comments
    sql = sql.replace(commentRegex, m => `<span class="comment">${m}</span>`);

    // Normalize spacing (conservatively)
    sql = sql.replace(/\s+/g, ' ');

    sql = formatAllSelectBlocks(sql)

    // Encadrer les sous-requêtes (sans inclure les parenthèses dans la div)
    sql = sql.replace(/\(\s*(SELECT[\s\S]*?FROM[\s\S]*?)\s*\)/gi, (_, subquery) => {
        return `(<div class="subquery">${subquery.trim()}</div>)`;
    });

    // Add line breaks before major blocks
    sql = sql.replace(/\b(WITH|SELECT|FROM|WHERE|LIMIT|GROUP BY|ORDER BY|HAVING)\b/gi, '\n\n$1');
    sql = sql.replace(/\b(LEFT JOIN|RIGHT JOIN|INNER JOIN|JOIN)\b/gi, '\n\t$1')

    // Indent subkeywords
    const subs = ['AND', 'OR'];
    for (const sk of subs) {
        const re = new RegExp(`\\b${sk}\\b`, 'gi');
        sql = sql.replace(re, m => `\n    ${m}`);
    }

    // Retours à la ligne entre chaque colonne du SELECT


    // Coloration
    sql = sql.replace(keywordRegex, match => {
        const upper = match.toUpperCase();
        if (['ON', 'AND', 'OR', 'AS', 'IS NOT NULL', 'IS NULL', 'LIKE', 'IN', 'NOT IN'].includes(upper)) {
            return `<span class="subkeyword">${match}</span>`;
        }
        return `<span class="keyword">${match}</span>`;
    });



    return `<pre class="sql-formatted">${sql.trim()}</pre>`;
}

function formatSelectColumnsBlock(selectCols) {
    const cols = [];
    let current = '';
    let depth = 0;
    let inQuotes = false;

    for (let i = 0; i < selectCols.length; i++) {
        const char = selectCols[i];

        if (char === "'" || char === '"') {
            inQuotes = !inQuotes;
        }

        if (!inQuotes) {
            if (char === '(') depth++;
            else if (char === ')') depth--;

            if (char === ',' && depth === 0) {
                cols.push(current.trim());
                current = '';
                continue;
            }
        }

        current += char;
    }

    if (current.trim()) cols.push(current.trim());
    return cols.map(c => `  ${c}`).join(',\n');
}

function formatAllSelectBlocks(sql) {
    const regex = /SELECT\s+(.*?)(\s+FROM)/gis;
    return sql.replace(regex, (match, cols, from) => {
        const formattedCols = formatSelectColumnsBlock(cols);
        return `SELECT\n${formattedCols}\n${from}`;
    });
}

function ensure_loading_screen() {
    if (!d3.select("#loading-screen").node()) {
        const loading_screen = d3.select("body")
            .append("div")
            .attr("id", "loading-screen");

        loading_screen.append("div").attr("class", "spinner");
        loading_screen.append("div").attr("id", "loading-steps");
        loading_screen.append("div").attr("id", "loading-detail");
    }
}

function show_loading_screen() {
    ensure_loading_screen();
    d3.select("#loading-screen").classed("active", true);
}

function hide_loading_screen() {
    ensure_loading_screen();
    d3.select("#loading-screen").classed("active", false);
}

function update_loading_screen(content) {
    const steps = content.main_steps || [];
    const detail = content.detail || {};

    const container = d3.select("#loading-steps");
    const detailContainer = d3.select("#loading-detail");

    // Data join for steps
    const stepSelection = container.selectAll(".loading-step")
        .data(steps, d => d.title);

    // EXIT old steps
    stepSelection.exit().remove();

    // ENTER new steps
    const stepEnter = stepSelection.enter()
        .append("div")
        .attr("class", "loading-step");

    stepEnter.append("div")
        .attr("class", "loading-step-title");

    stepEnter.append("progress")
        .attr("class", "loading-step-progress")
        .attr("max", 1);

    stepEnter.append("div")
        .attr("class", "loading-step-info");

    // MERGE enter + update
    const stepMerge = stepEnter.merge(stepSelection);

    // Update each step's content
    stepMerge.select(".loading-step-title")
        .text(d => d.title);

    stepMerge.select(".loading-step-progress")
        .attr("value", d => d.progress || 0);

    // Only show info for the step that has non-empty info
    // We assume only one step has non-empty info per your backend design
    stepMerge.select(".loading-step-info")
        .text(d => d.info || "");

    // Update detail container — show all keys/values nicely
    detailContainer.html(""); // clear

    Object.entries(detail).forEach(([key, val]) => {
        detailContainer.append("div")
            .attr("class", "loading-detail-item")
            .text(`${key}: ${val}`);
    });
}

function nested_dict_to_html(data) {
    // Récupérer toutes les clés de lignes (row keys) uniques
    const rowKeysSet = new Set();
    for (const col in data) {
      Object.keys(data[col]).forEach(rk => rowKeysSet.add(rk));
    }
    const rowKeys = Array.from(rowKeysSet);
  
    const cols = Object.keys(data);
  
    let html = '<table class="table-1" border="1" style="border-collapse: collapse;">';
  
    // Header
    html += '<thead><tr><th></th>'; // colonne vide pour la clé de ligne
    cols.forEach(col => {
      html += `<th>${col}</th>`;
    });
    html += '</tr></thead><tbody>';
  
    // Lignes
    rowKeys.forEach(rk => {
        html += `<tr><td><b>${rk}</b></td>`; // clé de ligne

        cols.forEach(col => {
            let val = data[col][rk];
            if (val === null || val === undefined) val = '—';
            else if (typeof val === 'number' && isNaN(val)) val = 'NaN';
            else val = format_number(val);

            html += `<td>${val}</td>`;
        });

        html += '</tr>';
    });
  
    html += '</tbody></table>';
    return html;
}


function format_number(number) {
    if (typeof(number) == 'string') return number

    if (number === undefined || number === null || isNaN(number)) {
        return "N/A"
    }
    if (number < 0) {
        return "-" + format_number(-number)
    }
    if (number < 1000) {
        number = number.toFixed(2)
    } else if (number < 1000000) {
        number = (number / 1000).toFixed(2) + "k"
    } else if (number < 1000000000) {
        number = (number / 1000000).toFixed(2) + "M"
    } else if (number < 1000000000000) {
        number = (number / 1000000000).toFixed(2) + "B"
    } else if (number < 1000000000000000) {
        number = (number / 1000000000000).toFixed(2) + "T"
    } else
        number = 999 + "T+"

    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/)
}

document.addEventListener('focusin', e => {
    if (e.target.matches('input[data-autoselect]')) e.target.select();
});
