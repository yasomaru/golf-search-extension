// コンテンツスクリプト
console.log('Golf Course Search Extension content script loaded');

// メッセージリスナー
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'setSearchKeyword') {
    // ポップアップのキーワード入力欄に値を設定
    const keywordInput = document.getElementById('keyword');
    if (keywordInput) {
      keywordInput.value = request.keyword;
    }
  }
});

// 楽天GORAページでの機能拡張
if (window.location.hostname.includes('gora.golf.rakuten.co.jp')) {
  enhanceGoraPage();
}

// 楽天GORAページの機能拡張
function enhanceGoraPage() {
  // ページ読み込み完了後に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addGoraEnhancements);
  } else {
    addGoraEnhancements();
  }
}

function addGoraEnhancements() {
  // コース詳細ページでの機能追加
  if (window.location.pathname.includes('/course/detail/')) {
    addCourseDetailEnhancements();
  }
  
  // 検索結果ページでの機能追加
  if (window.location.pathname.includes('/course/search/')) {
    addSearchResultEnhancements();
  }
}

// コース詳細ページの機能拡張
function addCourseDetailEnhancements() {
  // コース情報の取得
  const courseInfo = extractCourseInfo();
  
  if (courseInfo) {
    // 詳細情報パネルの追加
    addCourseInfoPanel(courseInfo);
    
    // 類似コース検索ボタンの追加
    addSimilarCourseButton(courseInfo);
  }
}

// 検索結果ページの機能拡張
function addSearchResultEnhancements() {
  // 高度なフィルター機能の追加
  addAdvancedFilters();
  
  // 検索結果の並び替え機能の追加
  addSortingOptions();
}

// コース情報の抽出
function extractCourseInfo() {
  const courseInfo = {};
  
  // コース名の取得
  const courseNameElement = document.querySelector('h1, .course-name, .golf-course-name');
  if (courseNameElement) {
    courseInfo.name = courseNameElement.textContent.trim();
  }
  
  // コースレートの取得
  const courseRatingElement = document.querySelector('.course-rating, .rating, [data-rating]');
  if (courseRatingElement) {
    courseInfo.courseRating = courseRatingElement.textContent.trim();
  }
  
  // スロープレートの取得
  const slopeRatingElement = document.querySelector('.slope-rating, .slope, [data-slope]');
  if (slopeRatingElement) {
    courseInfo.slopeRating = slopeRatingElement.textContent.trim();
  }
  
  // Redティー距離の取得
  const redTeeElement = document.querySelector('.red-tee, .red-tee-distance, [data-red-tee]');
  if (redTeeElement) {
    courseInfo.redTeeDistance = redTeeElement.textContent.trim();
  }
  
  // 料金の取得
  const priceElement = document.querySelector('.price, .course-price, [data-price]');
  if (priceElement) {
    courseInfo.price = priceElement.textContent.trim();
  }
  
  return courseInfo;
}

// コース情報パネルの追加
function addCourseInfoPanel(courseInfo) {
  const panel = document.createElement('div');
  panel.className = 'golf-search-extension-panel';
  panel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;
  
  panel.innerHTML = `
    <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">🏌️ コース情報</h3>
    <div style="font-size: 14px; line-height: 1.4;">
      ${courseInfo.name ? `<div><strong>コース名:</strong> ${courseInfo.name}</div>` : ''}
      ${courseInfo.courseRating ? `<div><strong>コースレート:</strong> ${courseInfo.courseRating}</div>` : ''}
      ${courseInfo.slopeRating ? `<div><strong>スロープレート:</strong> ${courseInfo.slopeRating}</div>` : ''}
      ${courseInfo.redTeeDistance ? `<div><strong>Redティー距離:</strong> ${courseInfo.redTeeDistance}</div>` : ''}
      ${courseInfo.price ? `<div><strong>料金:</strong> ${courseInfo.price}</div>` : ''}
    </div>
    <div style="margin-top: 15px;">
      <button id="searchSimilarBtn" style="
        background: #007bff;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-right: 8px;
      ">類似コース検索</button>
      <button id="closePanelBtn" style="
        background: #6c757d;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">閉じる</button>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // イベントリスナーの追加
  document.getElementById('searchSimilarBtn').addEventListener('click', function() {
    searchSimilarCourses(courseInfo);
  });
  
  document.getElementById('closePanelBtn').addEventListener('click', function() {
    panel.remove();
  });
}

// 類似コース検索
function searchSimilarCourses(courseInfo) {
  // 拡張機能のポップアップを開いて類似検索を実行
  chrome.runtime.sendMessage({
    action: 'openSimilarSearch',
    courseInfo: courseInfo
  });
}

// 高度なフィルター機能の追加
function addAdvancedFilters() {
  const filterContainer = document.createElement('div');
  filterContainer.className = 'golf-search-extension-filters';
  filterContainer.style.cssText = `
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
    margin: 15px 0;
    font-family: Arial, sans-serif;
  `;
  
  filterContainer.innerHTML = `
    <h3 style="margin: 0 0 10px 0; color: #333;">🔍 高度なフィルター</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
      <div>
        <label>コースレート範囲:</label>
        <div style="display: flex; gap: 5px; margin-top: 5px;">
          <input type="number" id="crMin" placeholder="最小" style="width: 60px; padding: 4px;">
          <span>～</span>
          <input type="number" id="crMax" placeholder="最大" style="width: 60px; padding: 4px;">
        </div>
      </div>
      <div>
        <label>スロープレート範囲:</label>
        <div style="display: flex; gap: 5px; margin-top: 5px;">
          <input type="number" id="srMin" placeholder="最小" style="width: 60px; padding: 4px;">
          <span>～</span>
          <input type="number" id="srMax" placeholder="最大" style="width: 60px; padding: 4px;">
        </div>
      </div>
      <div>
        <label>Redティー距離 (m):</label>
        <div style="display: flex; gap: 5px; margin-top: 5px;">
          <input type="number" id="rtMin" placeholder="最小" style="width: 60px; padding: 4px;">
          <span>～</span>
          <input type="number" id="rtMax" placeholder="最大" style="width: 60px; padding: 4px;">
        </div>
      </div>
      <div>
        <label>料金帯:</label>
        <select id="priceFilter" style="width: 100%; padding: 4px; margin-top: 5px;">
          <option value="">すべて</option>
          <option value="low">～5,000円</option>
          <option value="medium">5,000円～15,000円</option>
          <option value="high">15,000円～</option>
        </select>
      </div>
    </div>
    <div style="margin-top: 10px;">
      <button id="applyFiltersBtn" style="
        background: #28a745;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      ">フィルター適用</button>
    </div>
  `;
  
  // 検索結果の上部に挿入
  const searchResults = document.querySelector('.search-results, .course-list, .results');
  if (searchResults) {
    searchResults.parentNode.insertBefore(filterContainer, searchResults);
  }
  
  // フィルター適用ボタンのイベントリスナー
  document.getElementById('applyFiltersBtn').addEventListener('click', applyAdvancedFilters);
}

// 高度なフィルターの適用
function applyAdvancedFilters() {
  const filters = {
    courseRatingMin: document.getElementById('crMin').value,
    courseRatingMax: document.getElementById('crMax').value,
    slopeRatingMin: document.getElementById('srMin').value,
    slopeRatingMax: document.getElementById('srMax').value,
    redTeeDistanceMin: document.getElementById('rtMin').value,
    redTeeDistanceMax: document.getElementById('rtMax').value,
    priceRange: document.getElementById('priceFilter').value
  };
  
  // 検索結果のフィルタリング
  filterSearchResults(filters);
}

// 検索結果のフィルタリング
function filterSearchResults(filters) {
  const courseItems = document.querySelectorAll('.course-item, .golf-course-item, .result-item');
  
  courseItems.forEach(item => {
    let shouldShow = true;
    
    // 各フィルター条件をチェック
    // 実際の実装では、各コースアイテムからデータを抽出してフィルタリング
    // ここでは簡略化した例を示す
    
    if (shouldShow) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// 並び替えオプションの追加
function addSortingOptions() {
  const sortContainer = document.createElement('div');
  sortContainer.className = 'golf-search-extension-sort';
  sortContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 0;
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;
  
  sortContainer.innerHTML = `
    <label>並び替え:</label>
    <select id="sortSelect" style="padding: 4px; border-radius: 4px;">
      <option value="default">デフォルト</option>
      <option value="courseRating">コースレート順</option>
      <option value="slopeRating">スロープレート順</option>
      <option value="redTeeDistance">Redティー距離順</option>
      <option value="price">料金順</option>
      <option value="evaluation">評価順</option>
    </select>
  `;
  
  // 検索結果の上部に挿入
  const searchResults = document.querySelector('.search-results, .course-list, .results');
  if (searchResults) {
    searchResults.parentNode.insertBefore(sortContainer, searchResults);
  }
  
  // 並び替えのイベントリスナー
  document.getElementById('sortSelect').addEventListener('change', function() {
    sortSearchResults(this.value);
  });
}

// 検索結果の並び替え
function sortSearchResults(sortBy) {
  const courseItems = Array.from(document.querySelectorAll('.course-item, .golf-course-item, .result-item'));
  const container = courseItems[0]?.parentNode;
  
  if (!container) return;
  
  // 並び替えロジック（実際の実装では各アイテムからデータを抽出してソート）
  courseItems.sort((a, b) => {
    // 簡略化した例
    return 0;
  });
  
  // 並び替えたアイテムを再配置
  courseItems.forEach(item => {
    container.appendChild(item);
  });
}
