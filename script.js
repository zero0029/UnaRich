let currentType = '支出';
let myChart = null;

window.onload = () => {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('record-date');
    if(dateInput) dateInput.value = today;
    displayRecent(); 
    updateChart();
};

function setType(type) {
    currentType = type;
    document.getElementById('btn-exp').className = type === '支出' ? 'type-btn active-exp' : 'type-btn';
    document.getElementById('btn-inc').className = type === '收入' ? 'type-btn active-inc' : 'type-btn';
}

function addRecord() {
    const date = document.getElementById('record-date').value;
    const amt = document.getElementById('amount').value;
    const cat = document.getElementById('category').value;
    const note = document.getElementById('note').value;
    
    if (!date || !amt) return alert('日期和金額都要填喔！');

    const record = {
        type: currentType,
        category: cat,
        amount: parseFloat(amt),
        note: note || cat,
        date: date
    };

    let data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
    data.push(record);
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('my_cute_budget', JSON.stringify(data));

    document.getElementById('amount').value = '';
    document.getElementById('note').value = '';
    displayRecent();
    alert('紀錄成功囉！✨');
}

function displayRecent() {
    const list = document.getElementById('recent-list');
    const data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
    list.innerHTML = data.slice(0, 10).map(r => `
        <div class="record-item">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:bold;">${r.note}</span>
                <span class="date-label">${r.date} · <span class="tag">${r.category}</span></span>
            </div>
            <span class="${r.type === '支出' ? 'amt-exp' : 'amt-inc'}">
                ${r.type === '支出' ? '-' : '+'}${r.amount}
            </span>
        </div>
    `).join('');
}

function showPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    if(pageId === 'chart') updateChart();
}

function updateChart() {
    const data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
    const cats = {}; let totalExp = 0, totalInc = 0;
    data.forEach(r => {
        if(r.type === '支出') {
            cats[r.category] = (cats[r.category] || 0) + r.amount;
            totalExp += r.amount;
        } else { totalInc += r.amount; }
    });
    
    const summary = document.getElementById('summary-card');
    if(summary) {
        summary.innerHTML = `
            <p>☁️ 總支出：<span class="amt-exp">$${totalExp}</span></p>
            <p>☀️ 總收入：<span class="amt-inc">$${totalInc}</span></p>
            <hr style="border:1px dashed #eee">
            <p>🌱 結餘：<b>$${totalInc - totalExp}</b></p>
        `;
    }
    
    const canvas = document.getElementById('myChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats),
            datasets: [{ 
                data: Object.values(cats), 
                backgroundColor: ['#ffd93d', '#a2d2ff', '#6bcb77', '#ff8b8b', '#ced4da'] 
            }]
        },
        options: { plugins: { legend: { position: 'bottom' } } }
    });
}

function exportData() {
    const records = localStorage.getItem('my_cute_budget');
    const blob = new Blob([records], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `my_backup.json`;
    a.click();
}

function importData() {
    const file = document.getElementById('importFile').files[0];
    if(!file) return alert("請先選擇檔案");
    const reader = new FileReader();
    reader.onload = (e) => {
        localStorage.setItem('my_cute_budget', e.target.result);
        displayRecent(); updateChart(); alert('恢復成功！');
    };
    reader.readAsText(file);
}

// 在 script.js 底部加入

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('dark-mode-toggle');
    if (btn) btn.innerText = isDark ? '關閉' : '開啟';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (myChart) updateChart(); // 重新繪製圖表以適應顏色 (選配)
}

// 在 window.onload 裡面加入主題檢查
const existingOnload = window.onload;
window.onload = () => {
    if (existingOnload) existingOnload();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('dark-mode-toggle');
        if (btn) btn.innerText = '關閉';
    }
};

// 修改原有的 window.onload，讓它一進網頁就檢查主題
const oldOnload = window.onload;
window.onload = () => {
    if (oldOnload) oldOnload();
    
    // 檢查上次存的主題
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('dark-mode-toggle');
        if(btn) btn.innerText = '關閉';
    }
};

// 修改後的顯示列表函數
function displayRecent() {
    const list = document.getElementById('recent-list');
    const data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
    
    if (data.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-sub); margin: 20px 0;">還沒有紀錄喔 🍃</p>';
        return;
    }

    // 這裡我們在每一筆資料最後面加上一個 onclick="deleteRecord(${index})"
    list.innerHTML = data.slice(0, 10).map((r, index) => `
        <div class="record-item">
            <div style="display:flex; flex-direction:column; flex: 1;">
                <span style="font-weight:bold;">${r.note}</span>
                <span class="date-label">${r.date} · <span class="tag">${r.category}</span></span>
            </div>
            <div style="text-align: right; display: flex; align-items: center; gap: 10px;">
                <span class="${r.type === '支出' ? 'amt-exp' : 'amt-inc'}">
                    ${r.type === '支出' ? '-' : '+'}${r.amount}
                </span>
                <button onclick="deleteRecord(${index})" style="width:auto; padding: 5px 10px; margin:0; background:none; border:none; color:#ccc; font-size:18px; cursor:pointer;">×</button>
            </div>
        </div>
    `).join('');
}

// 新增：刪除紀錄的函數
function deleteRecord(index) {
    if (confirm("確定要刪除這筆紀錄嗎？ 🥺")) {
        let data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
        
        // 移除選中的那一筆
        data.splice(index, 1);
        
        // 存回 LocalStorage
        localStorage.setItem('my_cute_budget', JSON.stringify(data));
        
        // 重新整理畫面與圖表
        displayRecent();
        updateChart();
    }
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}