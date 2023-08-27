// background.js

const conditions = [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'chat.openai.com' }
      }),
new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'www.bing.com' }
      }),
new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'claude.ai' }
      }),
new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'bard.google.com' }
      }),
new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'yiyan.baidu.com' }
      }),
new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'www.baidu.com' }
      })];


chrome.runtime.onInstalled.addListener((details) => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions,
        actions: [
          new chrome.declarativeContent.RequestContentScript({
            js: ["index.js"] // dist/index.js json中声明注入
          })
        ]
      }
    ]);
  });
});
