// --- 1. 全域變數定義 ---
let currentType = '支出';
let myChart = null;
let editIndex = null; 

const categories = {
    '支出': [
        { val: '美味飽飽', emoji: '🍱' },
        { val: '交通嘟嘟', emoji: '🚲' },
        { val: '想買就買', emoji: '🛒' },
        { val: '生活點滴', emoji: '🕯️' },
        { val: '每月固定', emoji: '📌' },
        { val: '其他支出', emoji: '💸' }
    ],
    '收入': [
        { val: '薪資收入', emoji: '💰' },
        { val: '額外獎勵', emoji: '✨' },
        { val: '被動收入', emoji: '📈' },
        { val: '紅包零用', emoji: '🧧' },
        { val: '其他收入', emoji: '🍯' }
    ]
};

// --- 2. 初始化功能 ---
window.onload = () => {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('record-date');
    if(dateInput) dateInput.value = today;

    updateCategoryOptions('支出');

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('dark-mode-toggle');
        if(btn) btn.innerText = '關閉';
    }

    displayRecent(); 
    updateChart();
};

// --- 3. 介面切換功能 ---
function setType(type) {
    currentType = type;
    const btnExp = document.getElementById('btn-exp');
    const btnInc = document.getElementById('btn-inc');
    if(btnExp && btnInc) {
        btnExp.className = type === '支出' ? 'type-btn active-exp' : 'type-btn';
        btnInc.className = type === '收入' ? 'type-btn active-inc' : 'type-btn';
    }
    updateCategoryOptions(type);
}

function updateCategoryOptions(type) {
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;
    const options = categories[type];
    categorySelect.innerHTML = options.map(opt => 
        `<option value="${opt.val}">${opt.emoji} ${opt.val}</option>`
    ).join('');
}

function showPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    if(pageId === 'chart') updateChart();
}

// --- 4. 紀錄操作 (新增/修改/刪除) ---
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

    if (editIndex !== null) {
        data[editIndex] = record;
        editIndex = null; 
        const saveBtn = document.querySelector('.save-btn');
        if(saveBtn) {
            saveBtn.innerText = "🌟 儲存這筆紀錄";
            saveBtn.style.background = "var(--primary)";
        }
        showToast('✨ UnaRich 已更新紀錄囉！');
    } else {
        data.push(record);
        showToast('✨ 報告!已新增完成💰');
    }
    
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('my_cute_budget', JSON.stringify(data));

    document.getElementById('amount').value = '';
    document.getElementById('note').value = '';
    displayRecent();
    updateChart();
}

function displayRecent() {
    const list = document.getElementById('recent-list');
    const data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
    
    if (data.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-sub); margin: 20px 0;">還沒有紀錄喔 🍃</p>';
        return;
    }

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
                <button onclick="prepareEdit(${index})" style="width:auto; padding: 5px; margin:0; background:none; border:none; color:var(--accent); cursor:pointer;">✎</button>
                <button onclick="deleteRecord(${index})" style="width:auto; padding: 5px 10px; margin:0; background:none; border:none; color:#ccc; font-size:18px; cursor:pointer;">×</button>
            </div>
        </div>
    `).join('');
}

function prepareEdit(index) {
    const data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
    const item = data[index];
    editIndex = index;
    
    setType(item.type);
    document.getElementById('record-date').value = item.date;
    setTimeout(() => {
        document.getElementById('category').value = item.category;
    }, 0);
    
    document.getElementById('amount').value = item.amount;
    document.getElementById('note').value = item.note;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const saveBtn = document.querySelector('.save-btn');
    if(saveBtn) {
        saveBtn.innerText = "🔄 更新這筆紀錄";
        saveBtn.style.background = "var(--secondary)";
    }
}

// 🌟 使用自定義對話框的刪除函數
function deleteRecord(index) {
    openModal(
        "確定要刪除嗎？", 
        "UnaRich 會不記得這筆帳喔 🥺", 
        function() {
            let data = JSON.parse(localStorage.getItem('my_cute_budget')) || [];
            data.splice(index, 1);
            localStorage.setItem('my_cute_budget', JSON.stringify(data));
            displayRecent();
            updateChart();
            showToast('紀錄已抹除 🧹');
        }
    );
}

// --- 5. 圖表功能 ---
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
                backgroundColor: ['#ffd93d', '#a2d2ff', '#6bcb77', '#ff8b8b', '#6eb5ff'] 
            }]
        },
        options: { plugins: { legend: { position: 'bottom' } } }
    });
}

// --- 6. 彈窗與主題功能 ---
function showToast(message) {
    const toast = document.getElementById('toast');
    if(!toast) return;
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 2500);
}

function openModal(title, msg, onConfirm) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-msg').innerText = msg;
    const confirmBtn = document.getElementById('modal-confirm-btn');
    confirmBtn.onclick = () => {
        onConfirm();
        closeModal();
    };
    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('show');
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('dark-mode-toggle');
    if (btn) btn.innerText = isDark ? '關閉' : '開啟';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (myChart) updateChart();
}

// --- 7. PWA Service Worker ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}