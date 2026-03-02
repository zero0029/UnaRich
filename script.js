// --- 1. 全域變數 ---
let currentType = '支出';
let viewDate = new Date();
let expenseChart = null;
let incomeChart = null;
let editIndex = null;

const categories = {
    '支出': [
        { val: '美味飽飽', emoji: '🍱' }, { val: '交通嘟嘟', emoji: '🚲' },
        { val: '想買就買', emoji: '🛒' }, { val: '生活點滴', emoji: '🕯️' },
        { val: '每月固定', emoji: '📌' }, { val: '其他支出', emoji: '💸' }
    ],
    '收入': [
        { val: '薪資收入', emoji: '💰' }, { val: '額外獎勵', emoji: '✨' },
        { val: '被動收入', emoji: '📈' }, { val: '紅包零用', emoji: '🧧' },
        { val: '其他收入', emoji: '🍯' }
    ]
};

// --- 2. 初始化 ---
window.onload = () => {
    // 主題恢復
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('dark-mode-toggle');
        if(btn) btn.innerText = '關閉';
    }

    // 頁面功能分配
    if (document.getElementById('recent-list')) {
        const today = new Date().toISOString().split('T')[0];
        if(document.getElementById('record-date')) document.getElementById('record-date').value = today;
        updateCategoryOptions('支出');
        displayRecent();
    }

    if (document.getElementById('expenseChart')) {
        updateChart();
    }
};

// --- 3. 核心功能 ---
function setType(type) {
    currentType = type;
    document.getElementById('btn-exp').className = type === '支出' ? 'type-btn active-exp' : 'type-btn';
    document.getElementById('btn-inc').className = type === '收入' ? 'type-btn active-inc' : 'type-btn';
    updateCategoryOptions(type);
}

function updateCategoryOptions(type) {
    const sel = document.getElementById('category');
    if (!sel) return;
    sel.innerHTML = categories[type].map(opt => `<option value="${opt.val}">${opt.emoji} ${opt.val}</option>`).join('');
}

function addRecord() {
    const date = document.getElementById('record-date').value;
    const amt = document.getElementById('amount').value;
    const cat = document.getElementById('category').value;
    const note = document.getElementById('note').value;
    
    if (!date || !amt) return showToast('日期和金額都要填喔！');

    const record = { type: currentType, category: cat, amount: parseFloat(amt), note: note || cat, date: date };
    let data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];

    if (editIndex !== null) {
        data[editIndex] = record;
        editIndex = null;
    } else {
        data.push(record);
    }
    
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('my_cute_budget', JSON.stringify(data));
    
    // 重設輸入
    document.getElementById('amount').value = '';
    document.getElementById('note').value = '';
    showToast('✨ 紀錄成功！');
    displayRecent();
}

function displayRecent() {
    const list = document.getElementById('recent-list');
    if (!list) return;
    const data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
    list.innerHTML = data.slice(0, 10).map((r, i) => `
        <div class="record-item">
            <div><b>${r.note}</b><br><small>${r.date} · ${r.category}</small></div>
            <div class="${r.type === '支出' ? 'amt-exp' : 'amt-inc'}">${r.type === '支出' ? '-' : '+'}${r.amount}</div>
        </div>
    `).join('');
}

// --- 4. 圖表邏輯 ---
function changeMonth(delta) {
    viewDate.setMonth(viewDate.getMonth() + delta);
    updateChart();
}

function updateChart() {
    const data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;
    document.getElementById('current-month-display').innerText = `${year} 年 ${month.toString().padStart(2, '0')} 月`;

    const expCats = {}, incCats = {};
    let tExp = 0, tInc = 0;

    data.forEach(r => {
        const d = new Date(r.date);
        if (d.getFullYear() === year && (d.getMonth() + 1) === month) {
            if(r.type === '支出') {
                expCats[r.category] = (expCats[r.category] || 0) + r.amount;
                tExp += r.amount;
            } else {
                incCats[r.category] = (incCats[r.category] || 0) + r.amount;
                tInc += r.amount;
            }
        }
    });

    document.getElementById('summary-card').innerHTML = `
        <p>☁️ 支出：<span class="amt-exp">$${tExp}</span></p>
        <p>☀️ 收入：<span class="amt-inc">$${tInc}</span></p>
        <p>🌱 結餘：<b>$${tInc - tExp}</b></p>
    `;

    renderDoughnut('expenseChart', expCats, expenseChart, (c) => expenseChart = c);
    renderDoughnut('incomeChart', incCats, incomeChart, (c) => incomeChart = c);
}

function renderDoughnut(id, catData, chartInst, setInst) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (chartInst) chartInst.destroy();
    
    const newChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(catData),
            datasets: [{ data: Object.values(catData), backgroundColor: ['#ffd93d', '#ff8b8b', '#a2d2ff', '#6bcb77', '#6eb5ff'] }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
        }
    });
    setInst(newChart);
}

// --- 5. 通用功能 ---
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const btn = document.getElementById('dark-mode-toggle');
    if(btn) btn.innerText = isDark ? '關閉' : '開啟';
    if(document.getElementById('expenseChart')) updateChart();
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}