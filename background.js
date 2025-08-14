// バックグラウンドスクリプト
chrome.runtime.onInstalled.addListener(function() {
  console.log('Golf Course Search Extension installed');
  
  // デフォルト設定の初期化
  chrome.storage.sync.get(['rakutenApiKey'], function(result) {
    if (!result.rakutenApiKey) {
      // APIキーが設定されていない場合の初期設定
      chrome.storage.sync.set({
        rakutenApiKey: 'YOUR_APPLICATION_ID_HERE'
      });
    }
  });
});

// メッセージリスナー
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getApiKey') {
    chrome.storage.sync.get(['rakutenApiKey'], function(result) {
      sendResponse({ apiKey: result.rakutenApiKey });
    });
    return true; // 非同期レスポンスを示す
  }
  
  if (request.action === 'setApiKey') {
    chrome.storage.sync.set({
      rakutenApiKey: request.apiKey
    }, function() {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'openTab') {
    chrome.tabs.create({ url: request.url });
    sendResponse({ success: true });
  }
});

// コンテキストメニューの作成
chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: 'searchGolfCourse',
    title: 'ゴルフ場を検索',
    contexts: ['selection']
  });
});

// コンテキストメニューのクリック処理
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === 'searchGolfCourse') {
    const selectedText = info.selectionText;
    
    // ポップアップを開いて検索キーワードを設定
    chrome.action.openPopup();
    
    // 少し遅延を入れてからメッセージを送信
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'setSearchKeyword',
        keyword: selectedText
      });
    }, 100);
  }
});

// タブの更新時の処理
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
    // 楽天GORAのページで拡張機能を有効化
    if (tab.url.includes('gora.golf.rakuten.co.jp')) {
      chrome.action.enable(tabId);
    } else {
      chrome.action.disable(tabId);
    }
  }
});

// エラーハンドリング
chrome.runtime.onSuspend.addListener(function() {
  console.log('Extension suspended');
});
