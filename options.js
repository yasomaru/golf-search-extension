// 設定ページのJavaScript
document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');

  // 保存されたAPIキーを読み込み
  loadApiKey();

  // 保存ボタンのイベントリスナー
  saveBtn.addEventListener('click', saveApiKey);

  // テストボタンのイベントリスナー
  testBtn.addEventListener('click', testApiConnection);

  // APIキーの読み込み
  function loadApiKey() {
    chrome.storage.sync.get(['rakutenApiKey'], function(result) {
      if (result.rakutenApiKey && result.rakutenApiKey !== 'YOUR_APPLICATION_ID_HERE') {
        apiKeyInput.value = result.rakutenApiKey;
        showStatus('APIキーが読み込まれました', 'success');
      }
    });
  }

  // APIキーの保存
  function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('APIキーを入力してください', 'error');
      return;
    }

    if (apiKey === 'YOUR_APPLICATION_ID_HERE') {
      showStatus('有効なAPIキーを入力してください', 'error');
      return;
    }

    chrome.storage.sync.set({
      rakutenApiKey: apiKey
    }, function() {
      if (chrome.runtime.lastError) {
        showStatus('保存に失敗しました: ' + chrome.runtime.lastError.message, 'error');
      } else {
        showStatus('APIキーが正常に保存されました', 'success');
        
        // ポップアップのAPIキーも更新
        updatePopupApiKey(apiKey);
      }
    });
  }

  // ポップアップのAPIキーを更新
  function updatePopupApiKey(apiKey) {
    // ポップアップが開いている場合、メッセージを送信
    chrome.runtime.sendMessage({
      action: 'updateApiKey',
      apiKey: apiKey
    });
  }

  // API接続テスト
  async function testApiConnection() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey || apiKey === 'YOUR_APPLICATION_ID_HERE') {
      showStatus('有効なAPIキーを入力してください', 'error');
      return;
    }

    showStatus('API接続をテスト中...', 'info');
    testBtn.disabled = true;

    try {
      // 楽天GORA検索APIでテスト
      const testUrl = `https://app.rakuten.co.jp/services/api/Gora/GoraGolfCourseSearch/20170623?format=json&applicationId=${apiKey}&keyword=東京&hits=1`;
      
      const response = await fetch(testUrl);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      if (data.Items && data.Items.length > 0) {
        showStatus('API接続テスト成功！正常に動作しています。', 'success');
      } else {
        showStatus('API接続は成功しましたが、検索結果がありませんでした。', 'info');
      }

    } catch (error) {
      console.error('API接続テストエラー:', error);
      
      if (error.message.includes('wrong_parameter')) {
        showStatus('APIキーが無効です。正しいApplication IDを入力してください。', 'error');
      } else if (error.message.includes('too_many_requests')) {
        showStatus('API利用制限に達しました。しばらく時間をおいてから再試行してください。', 'error');
      } else {
        showStatus('API接続テストに失敗しました: ' + error.message, 'error');
      }
    } finally {
      testBtn.disabled = false;
    }
  }

  // ステータス表示
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';

    // 成功メッセージは3秒後に自動で非表示
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  }

  // Enterキーで保存
  apiKeyInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveApiKey();
    }
  });

  // APIキーの表示/非表示切り替え
  let isPasswordVisible = false;
  const togglePasswordBtn = document.createElement('button');
  togglePasswordBtn.textContent = '👁️';
  togglePasswordBtn.style.cssText = `
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: #666;
  `;
  
  const inputContainer = apiKeyInput.parentNode;
  inputContainer.style.position = 'relative';
  inputContainer.appendChild(togglePasswordBtn);

  togglePasswordBtn.addEventListener('click', function() {
    isPasswordVisible = !isPasswordVisible;
    apiKeyInput.type = isPasswordVisible ? 'text' : 'password';
    togglePasswordBtn.textContent = isPasswordVisible ? '🙈' : '👁️';
  });
});

// バックグラウンドスクリプトからのメッセージ受信
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'updateApiKey') {
    // 設定ページが開いている場合、APIキーを更新
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput) {
      apiKeyInput.value = request.apiKey;
    }
  }
});
