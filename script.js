let currentType = '支出';
let viewDate = new Date();
let expChart = null, incChart = null;

const categories = {
    '支出': [{v:'美味飽飽',e:'🍱'},{v:'交通嘟嘟',e:'🚲'},{v:'想買就買',e:'🛒'},{v:'生活點滴',e:'🕯️'},{v:'每月固定',e:'📌'},{v:'其他支出',e:'💸'}],
    '收入': [{v:'薪資收入',e:'💰'},{v:'額外獎勵',e:'✨'},{v:'被動收入',e:'📈'},{v:'紅包零用',e:'🧧'},{v:'其他收入',e:'🍯'}]
};
// 1. 定義導覽列函數
function injectNavbar() {
    const placeholder = document.getElementById('nav-placeholder');
    if (!placeholder) return;

    // 取得目前檔案名稱 (例如 index.html)
    const currentPage = window.location.pathname.split("/").pop() || 'index.html';

    const navItems = [
        { name: '記帳', icon: '📝', link: 'index.html' },
        { name: '月曆', icon: '📅', link: 'calendar.html' },
        { name: '報表', icon: '📊', link: 'charts.html' },
        { name: '設定', icon: '⚙️', link: 'settings.html' }
    ];

    const navHtml = `
        <nav class="bottom-nav">
            ${navItems.map(item => `
                <a href="${item.link}" class="nav-item ${currentPage === item.link ? 'active' : ''}">
                    <span class="nav-icon">${item.icon}</span>
                    <p>${item.name}</p>
                </a>
            `).join('')}
        </nav>
    `;

    placeholder.innerHTML = navHtml;
}

// 2. 在 window.onload 裡面呼叫它
window.onload = () => {
    injectNavbar(); // 🌟 執行注入導覽列

    // ... 妳原本的其他初始化邏輯 (如恢復主題、頁面判斷等)
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const darkBtn = document.getElementById('dark-mode-toggle');
        if(darkBtn) darkBtn.innerText = '關閉';
    }

    if (document.getElementById('recent-list')) {
        document.getElementById('record-date').value = new Date().toISOString().split('T')[0];
        updateCats('支出');
        displayRecent();
    }
    if (document.getElementById('expenseChart')) updateChart();
    if (document.getElementById('calendar-grid')) renderCalendar();
};


function setType(t) {
    currentType = t;
    document.getElementById('btn-exp').className = t === '支出' ? 'type-btn active-exp' : 'type-btn';
    document.getElementById('btn-inc').className = t === '收入' ? 'type-btn active-inc' : 'type-btn';
    updateCats(t);
}

function updateCats(t) {
    const sel = document.getElementById('category');
    if(!sel) return;
    sel.innerHTML = categories[t].map(c => `<option value="${c.v}">${c.e} ${c.v}</option>`).join('');
}

function addRecord() {
    const d = document.getElementById('record-date').value;
    const a = document.getElementById('amount').value;
    if(!d || !a) return alert('請填寫日期與金額');
    const item = { type: currentType, category: document.getElementById('category').value, amount: parseFloat(a), note: document.getElementById('note').value || '紀錄', date: d };
    const list = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
    list.push(item);
    localStorage.setItem('my_cute_budget', JSON.stringify(list));
    document.getElementById('amount').value = '';
    showToast('✨ 儲存成功！');
    displayRecent();
}

function displayRecent() {
    const el = document.getElementById('recent-list');
    if(!el) return;
    const list = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
    el.innerHTML = list.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0, 10).map(i => `
        <div class="record-item">
            <div><b>${i.note}</b><br><small>${i.date} · ${i.category}</small></div>
            <div style="color:${i.type==='支出'?'#ff8b8b':'#6bcb77'}">${i.type==='支出'?'-':'+'}${i.amount}</div>
        </div>
    `).join('');
}

function changeMonth(n) { viewDate.setMonth(viewDate.getMonth() + n); updateChart(); }

function updateChart() {
    const data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
    const y = viewDate.getFullYear(), m = viewDate.getMonth() + 1;
    document.getElementById('current-month-display').innerText = `${y} 年 ${m.toString().padStart(2,'0')} 月`;
    const exObj = {}, inObj = {};
    let te = 0, ti = 0;
    data.forEach(r => {
        const rd = new Date(r.date);
        if(rd.getFullYear()===y && (rd.getMonth()+1)===m) {
            if(r.type==='支出'){ exObj[r.category]=(exObj[r.category]||0)+r.amount; te+=r.amount; }
            else { inObj[r.category]=(inObj[r.category]||0)+r.amount; ti+=r.amount; }
        }
    });
    document.getElementById('summary-card').innerHTML = `<p>支出: <span style="color:#ff8b8b">$${te}</span> | 收入: <span style="color:#6bcb77">$${ti}</span> | 結餘: <b>$${ti-te}</b></p>`;
    draw('expenseChart', exObj, expChart, c => expChart = c);
    draw('incomeChart', inObj, incChart, c => incChart = c);
}

function draw(id, obj, inst, set) {
    const ctx = document.getElementById(id);
    if(!ctx) return;
    if(inst) inst.destroy();
    set(new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: { labels: Object.keys(obj), datasets: [{ data: Object.values(obj), backgroundColor: ['#ffd93d','#ff8b8b','#a2d2ff','#6bcb77','#6eb5ff'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    }));
}

function toggleDarkMode() {
    const is = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', is ? 'dark' : 'light');
    document.getElementById('dark-mode-toggle').innerText = is ? '關閉' : '開啟';
}

function showToast(m) {
    const t = document.getElementById('toast');
    if(!t) return;
    t.innerText = m; t.style.opacity = 1;
    setTimeout(() => t.style.opacity = 0, 2000);
}


// 在 window.onload 中加入
if (document.getElementById('calendar-grid')) {
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    const data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // 更新上方標題
    document.getElementById('current-month-display').innerText = `${year} 年 ${(month + 1).toString().padStart(2, '0')} 月`;

    // 1. 生成週標題
    const weeks = ['日', '一', '二', '三', '四', '五', '六'];
    let html = weeks.map(w => `<div class="calendar-day-head">${w}</div>`).join('');

    // 2. 計算日期
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 空白格子
    for (let i = 0; i < firstDay; i++) html += `<div></div>`;

    // 日期格子
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        
        // 統計當日收支
        let dayExp = 0, dayInc = 0;
        data.filter(r => r.date === dateStr).forEach(r => {
            if (r.type === '支出') dayExp += r.amount;
            else dayInc += r.amount;
        });

        const isToday = new Date().toISOString().split('T')[0] === dateStr ? 'today' : '';
        
        html += `
            <div class="calendar-day ${isToday}" onclick="showDayDetail('${dateStr}', this)">
                <span>${d}</span>
                ${dayExp > 0 ? `<span class="cal-exp">-${dayExp}</span>` : ''}
                ${dayInc > 0 ? `<span class="cal-inc">+${dayInc}</span>` : ''}
            </div>
        `;
    }
    grid.innerHTML = html;
}

function showDayDetail(dateStr, el) {
    // 切換選取狀態樣式
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    if (el) el.classList.add('selected');

    document.getElementById('selected-date-title').innerText = `${dateStr} 明細`;
    
    const data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
    const dayData = data.filter(r => r.date === dateStr);
    const listEl = document.getElementById('day-detail-list');

    if (dayData.length === 0) {
        listEl.innerHTML = `<p style="text-align:center; color:var(--text-sub); padding:20px;">這天沒有紀錄喔 🍃</p>`;
        return;
    }

    listEl.innerHTML = dayData.map(r => `
        <div class="record-item">
            <div><b>${r.note}</b><br><small>${r.category}</small></div>
            <div style="color:${r.type === '支出' ? '#ff8b8b' : '#6bcb77'}">
                ${r.type === '支出' ? '-' : '+'}${r.amount}
            </div>
        </div>
    `).join('');
}

// 修改之前的 changeMonth 函數，讓它也能觸發月曆更新
function changeMonth(n) {
    viewDate.setMonth(viewDate.getMonth() + n);
    if (document.getElementById('expenseChart')) updateChart();
    if (document.getElementById('calendar-grid')) renderCalendar();
}