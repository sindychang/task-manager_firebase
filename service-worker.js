// 版本號 - 每次更新都改這個數字，用戶會自動更新
const CACHE_NAME = 'taskmanager-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker 正在安裝...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✓ 緩存已打開');
        // 不強制緩存外部CDN，只緩存本地文件
        return cache.add(urlsToCache[0]);
      })
      .catch((error) => {
        console.warn('部分資源緩存失敗，但這是正常的：', error);
      })
  );
});

// 激活 Service Worker - 清理舊版本
self.addEventListener('activate', (event) => {
  console.log('Service Worker 正在激活...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊快取：', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 攔截請求 - 離線優先策略
self.addEventListener('fetch', (event) => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    // 先查看快取
    caches.match(event.request)
      .then((response) => {
        // 如果快取有，直接返回
        if (response) {
          console.log('✓ 從快取返回:', event.request.url);
          return response;
        }

        // 快取沒有，嘗試網路請求
        return fetch(event.request)
          .then((response) => {
            // 檢查是否有效的回應
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // 複製回應用於快取
            const responseToCache = response.clone();

            // 如果是重要資源，就快取起來
            if (event.request.url.includes('fonts.googleapis.com') || 
                event.request.url.includes('cdn.tailwindcss.com')) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }

            return response;
          })
          .catch(() => {
            // 網路也失敗，返回離線頁面或默認
            console.warn('網路請求失敗，已離線:', event.request.url);
            
            // 如果請求的是HTML頁面，返回快取的主頁
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

console.log('✓ Service Worker 已載入');
