// 楽天GORA API設定
const RAKUTEN_API_CONFIG = {
  baseUrl: 'https://app.rakuten.co.jp/services/api/Gora',
  searchEndpoint: '/GoraGolfCourseSearch/20170623',
  detailEndpoint: '/GoraGolfCourseDetail/20170623',
  // 注意: 実際の使用時には有効なapplicationIdを設定してください
  applicationId: 'your_application_id_here'
};

// DOM要素の取得
const elements = {
  keyword: document.getElementById('keyword'),
  area: document.getElementById('area'),
  searchBtn: document.getElementById('searchBtn'),
  clearBtn: document.getElementById('clearBtn'),
  resultsList: document.getElementById('resultsList'),
  loading: document.getElementById('loading'),
  noResults: document.getElementById('noResults')
};

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', function() {
  elements.searchBtn.addEventListener('click', performSearch);
  elements.clearBtn.addEventListener('click', clearForm);
  
  // 設定リンクのイベントリスナー
  document.getElementById('openSettings').addEventListener('click', function(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  // 設定の読み込み
  loadSettings();
});

// 検索実行
async function performSearch() {
  try {
    // APIキーのチェック
    if (!RAKUTEN_API_CONFIG.applicationId || RAKUTEN_API_CONFIG.applicationId === 'YOUR_APPLICATION_ID_HERE') {
      showError('APIキーが設定されていません。設定ページでAPIキーを入力してください。');
      return;
    }
    
    showLoading(true);
    clearResults();
    
    const searchParams = getSearchParameters();
    const searchResults = await searchGolfCourses(searchParams);
    
    if (searchResults.length === 0) {
      showNoResults();
    } else {
      displayResults(searchResults);
    }
  } catch (error) {
    console.error('検索エラー:', error);
    
    // エラーの種類に応じて適切なメッセージを表示
    let errorMessage = '検索中にエラーが発生しました。';
    
    if (error.message.includes('wrong_parameter')) {
      errorMessage = 'APIキーが無効です。設定ページで正しいApplication IDを入力してください。';
    } else if (error.message.includes('too_many_requests')) {
      errorMessage = 'API利用制限に達しました。しばらく時間をおいてから再試行してください。';
    } else if (error.message.includes('network')) {
      errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
    } else if (error.message.includes('CORS')) {
      errorMessage = 'CORSエラーが発生しました。ブラウザの設定を確認してください。';
    } else if (error.message.includes('fetch')) {
      errorMessage = 'APIへの接続に失敗しました。APIキーとネットワーク接続を確認してください。';
    }
    
    showError(errorMessage);
  } finally {
    showLoading(false);
  }
}

// 検索パラメータの取得
function getSearchParameters() {
  return {
    keyword: elements.keyword.value.trim(),
    areaCode: elements.area.value
  };
}

// 楽天GORA APIを使用したゴルフ場検索
async function searchGolfCourses(params) {
  const apiUrl = buildSearchUrl(params);
  
  try {
    console.log('API URL:', apiUrl); // デバッグ用
    
    const response = await fetch(apiUrl);
    console.log('Response status:', response.status); // デバッグ用
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API Response:', data); // デバッグ用
    
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }
    
    let courses = data.Items || [];
    console.log('Found courses:', courses.length); // デバッグ用
    
    // 基本検索結果を返す（詳細APIは後で必要に応じて呼び出す）
    return courses;
  } catch (error) {
    console.error('API呼び出しエラー:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      url: apiUrl
    });
    throw error;
  }
}

// 検索URLの構築
function buildSearchUrl(params) {
  const url = new URL(RAKUTEN_API_CONFIG.baseUrl + RAKUTEN_API_CONFIG.searchEndpoint);
  
  url.searchParams.set('format', 'json');
  url.searchParams.set('applicationId', RAKUTEN_API_CONFIG.applicationId);
  url.searchParams.set('formatVersion', '2');
  
  if (params.keyword) {
    url.searchParams.set('keyword', params.keyword);
    console.log('Search keyword:', params.keyword);
  }
  
  if (params.areaCode && params.areaCode !== '') {
    url.searchParams.set('areaCode', params.areaCode);
    console.log('Area code:', params.areaCode);
  }
  
  // ページネーション
  url.searchParams.set('page', '1');
  url.searchParams.set('hits', '30');
  
  console.log('Built URL:', url.toString());
  return url.toString();
}

// 詳細条件でのフィルタリング（簡略化版）
async function filterCoursesByDetails(courses, params) {
  // 基本検索結果をそのまま返す
  return courses;
}

// コース詳細情報の取得
async function fetchCourseDetails(golfCourseId) {
  const url = new URL(RAKUTEN_API_CONFIG.baseUrl + RAKUTEN_API_CONFIG.detailEndpoint);
  
  url.searchParams.set('format', 'json');
  url.searchParams.set('applicationId', RAKUTEN_API_CONFIG.applicationId);
  url.searchParams.set('golfCourseId', golfCourseId);
  // formatVersionは削除（詳細APIでは使用しない）
  
  try {
    console.log('Fetching details for course ID:', golfCourseId);
    console.log('Detail API URL:', url.toString());
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Detail API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Detail API Response:', data);
    
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }
    
    // APIレスポンスの構造に合わせてItemを返す
    return data.Item || null;
  } catch (error) {
    console.error(`コース詳細取得エラー (ID: ${golfCourseId}):`, error);
    return null;
  }
}

// 詳細情報の表示
function displayCourseDetails(golfCourseId, detailData) {
  // 該当するコース要素を探す
  const courseElements = document.querySelectorAll('.course-item');
  
  courseElements.forEach(element => {
    const detailBtn = element.querySelector('.get-details-btn');
    if (detailBtn && detailBtn.getAttribute('data-course-id') === golfCourseId) {
      // 詳細情報を追加表示
      const detailsContainer = element.querySelector('.course-details');
      
      // 詳細情報のHTMLを作成（APIレスポンスの構造に合わせて更新）
      const detailsHTML = `
        <div class="course-detail">
          <strong>コース名:</strong> ${detailData.courseName || '不明'}
        </div>
        <div class="course-detail">
          <strong>ホール数:</strong> ${detailData.holeCount || '不明'}ホール
        </div>
        <div class="course-detail">
          <strong>パー:</strong> ${detailData.parCount || '不明'}
        </div>
        <div class="course-detail">
          <strong>コース長:</strong> ${detailData.courseDistance || '不明'}
        </div>
        <div class="course-detail">
          <strong>料金（平日）:</strong> ${detailData.weekdayMinPrice ? '¥' + detailData.weekdayMinPrice.toLocaleString() : '不明'}
        </div>
        <div class="course-detail">
          <strong>料金（休日）:</strong> ${detailData.holidayMinPrice ? '¥' + detailData.holidayMinPrice.toLocaleString() : '不明'}
        </div>
        <div class="course-detail">
          <strong>コースタイプ:</strong> ${detailData.courseType || '不明'}
        </div>
        <div class="course-detail">
          <strong>グリーン:</strong> ${detailData.green || '不明'}
        </div>
        <div class="course-detail">
          <strong>設計者:</strong> ${detailData.designer || '不明'}
        </div>
        <div class="course-detail">
          <strong>評価（総合）:</strong> ${detailData.evaluation || '不明'}
        </div>
        <div class="course-detail">
          <strong>評価（スタッフ）:</strong> ${detailData.staff || '不明'}
        </div>
        <div class="course-detail">
          <strong>評価（設備）:</strong> ${detailData.facility || '不明'}
        </div>
        <div class="course-detail">
          <strong>評価（食事）:</strong> ${detailData.meal || '不明'}
        </div>
        <div class="course-detail">
          <strong>評価（コース）:</strong> ${detailData.course || '不明'}
        </div>
        <div class="course-detail">
          <strong>評価（コスパ）:</strong> ${detailData.costperformance || '不明'}
        </div>
        <div class="course-detail">
          <strong>評価（距離）:</strong> ${detailData.distance || '不明'}
        </div>
        <div class="course-detail">
          <strong>評価（フェアウェイ）:</strong> ${detailData.fairway || '不明'}
        </div>
        <div class="course-detail">
          <strong>練習場:</strong> ${detailData.practiceFacility || '不明'}
        </div>
        <div class="course-detail">
          <strong>最寄りIC:</strong> ${detailData.ic || '不明'} (${detailData.icDistance || '不明'})
        </div>
      `;
      
      // 既存の詳細情報を更新
      detailsContainer.innerHTML = detailsContainer.innerHTML + detailsHTML;
      
      // ボタンの状態を更新
      detailBtn.textContent = '詳細表示済み';
      detailBtn.style.background = '#28a745';
      detailBtn.disabled = true;
    }
  });
}

// 詳細条件とのマッチング
function matchesDetailedCriteria(courseDetail, params) {
  const details = courseDetail;
  
  // コースレートのチェック
  if (params.courseRating.min !== null || params.courseRating.max !== null) {
    const courseRating = parseFloat(details.courseRating) || 0;
    if (params.courseRating.min !== null && courseRating < params.courseRating.min) return false;
    if (params.courseRating.max !== null && courseRating > params.courseRating.max) return false;
  }
  
  // スロープレートのチェック
  if (params.slopeRating.min !== null || params.slopeRating.max !== null) {
    const slopeRating = parseFloat(details.slopeRating) || 0;
    if (params.slopeRating.min !== null && slopeRating < params.slopeRating.min) return false;
    if (params.slopeRating.max !== null && slopeRating > params.slopeRating.max) return false;
  }
  
  // Redティー総飛距離のチェック
  if (params.redTeeDistance.min !== null || params.redTeeDistance.max !== null) {
    const redTeeDistance = parseFloat(details.redTeeDistance) || 0;
    if (params.redTeeDistance.min !== null && redTeeDistance < params.redTeeDistance.min) return false;
    if (params.redTeeDistance.max !== null && redTeeDistance > params.redTeeDistance.max) return false;
  }
  
  // 料金帯のチェック
  if (params.priceRange) {
    const price = parseFloat(details.price) || 0;
    switch (params.priceRange) {
      case 'low':
        if (price > 5000) return false;
        break;
      case 'medium':
        if (price < 5000 || price > 15000) return false;
        break;
      case 'high':
        if (price < 15000) return false;
        break;
    }
  }
  
  // 設備のチェック
  if (params.facilities.drivingRange && !details.drivingRange) return false;
  if (params.facilities.restaurant && !details.restaurant) return false;
  if (params.facilities.proShop && !details.proShop) return false;
  if (params.facilities.lockerRoom && !details.lockerRoom) return false;
  
  return true;
}

// 結果の表示
function displayResults(courses) {
  elements.resultsList.innerHTML = '';
  
  courses.forEach(course => {
    console.log('Course data:', course); // デバッグ用：コースデータを確認
    const courseElement = createCourseElement(course);
    elements.resultsList.appendChild(courseElement);
  });
}

// コース要素の作成
function createCourseElement(course) {
  const div = document.createElement('div');
  div.className = 'course-item';
  
  // 基本情報を表示
  div.innerHTML = `
    <div class="course-name">${course.golfCourseName || course.golfCourseNameKana || '名称不明'}</div>
    <div class="course-details">
      <div class="course-detail">
        <strong>場所:</strong> ${course.prefecture || course.area || '不明'}
      </div>
      <div class="course-detail">
        <strong>住所:</strong> ${course.address || '不明'}
      </div>
      <div class="course-detail">
        <strong>電話番号:</strong> ${course.telephoneNo || '不明'}
      </div>
      <div class="course-detail">
        <strong>評価:</strong> ${course.evaluation || '不明'}
      </div>
    </div>
    <div class="course-actions">
      <button class="get-details-btn" data-course-id="${course.golfCourseId}">
        詳細情報取得
      </button>
      <button class="reserve-btn" data-reserve-url="${course.reserveCalUrl || ''}">
        予約する
      </button>
    </div>
  `;
  
  // イベントリスナーを追加
  const getDetailsBtn = div.querySelector('.get-details-btn');
  const reserveBtn = div.querySelector('.reserve-btn');
  
  getDetailsBtn.addEventListener('click', function() {
    const courseId = this.getAttribute('data-course-id');
    getCourseDetails(courseId, this);
  });
  
  reserveBtn.addEventListener('click', function() {
    const reserveUrl = this.getAttribute('data-reserve-url');
    openReservation(reserveUrl);
  });
  
  return div;
}

// viewCourseDetails関数は削除（詳細情報取得ボタンに統合）

// 詳細情報取得
async function getCourseDetails(golfCourseId, buttonElement) {
  try {
    // ボタンをローディング状態にする
    buttonElement.textContent = '取得中...';
    buttonElement.classList.add('loading');
    buttonElement.disabled = true;

    const detailData = await fetchCourseDetails(golfCourseId);
    
    if (detailData) {
      // 詳細情報を表示
      displayCourseDetails(golfCourseId, detailData);
      buttonElement.textContent = '詳細表示済み';
      buttonElement.style.background = '#28a745';
    } else {
      buttonElement.textContent = '取得失敗';
      buttonElement.style.background = '#dc3545';
    }
  } catch (error) {
    console.error('詳細情報取得エラー:', error);
    buttonElement.textContent = '取得失敗';
    buttonElement.style.background = '#dc3545';
  } finally {
    buttonElement.classList.remove('loading');
    buttonElement.disabled = false;
  }
}

// 予約ページを開く
function openReservation(reserveUrl) {
  if (reserveUrl) {
    chrome.tabs.create({ url: reserveUrl });
  } else {
    alert('予約URLが利用できません。');
  }
}

// フォームのクリア
function clearForm() {
  elements.keyword.value = '';
  elements.area.selectedIndex = 0;
  clearResults();
}

// 結果のクリア
function clearResults() {
  elements.resultsList.innerHTML = '';
  elements.noResults.style.display = 'none';
}

// ローディング表示
function showLoading(show) {
  elements.loading.style.display = show ? 'block' : 'none';
  elements.searchBtn.disabled = show;
}

// 結果なし表示
function showNoResults() {
  elements.noResults.style.display = 'block';
}

// エラー表示
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = 'color: red; text-align: center; padding: 10px; background: #ffe6e6; border-radius: 4px; margin: 10px 0;';
  
  elements.resultsList.appendChild(errorDiv);
}

// 設定の読み込み
function loadSettings() {
  chrome.storage.sync.get(['rakutenApiKey'], function(result) {
    if (result.rakutenApiKey && result.rakutenApiKey !== 'YOUR_APPLICATION_ID_HERE') {
      RAKUTEN_API_CONFIG.applicationId = result.rakutenApiKey;
      console.log('API Key loaded from storage:', result.rakutenApiKey.substring(0, 10) + '...');
    } else {
      console.log('No valid API key found in storage');
      showError('APIキーが設定されていません。設定ページでAPIキーを入力してください。');
    }
  });
}

// 設定の保存
function saveSettings() {
  chrome.storage.sync.set({
    rakutenApiKey: RAKUTEN_API_CONFIG.applicationId
  });
}

// グローバル関数の公開は不要になりました（イベントリスナーを使用）
