const CACHE_NAME = 'unarich-v2'; // 🌟 建議更新版本號，強制瀏覽器抓取新檔案
const assets = [
    './',
    './index.html',
    './charts.html',     // 🌟 新增
    './settings.html',   // 🌟 新增
    './style.css',
    './script.js',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js' // 🌟 建議也快取 Chart.js 庫
];

// 安裝 Service Worker 並快取檔案
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('正在快取 UnaRich 所有資源...');
            return cache.addAll(assets);
        })
    );
});

// 攔截請求，優先從快取中尋找
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(res => {
            return res || fetch(e.request);
        })
    );
});

// 🌟 額外加入：清理舊版本的快取
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});