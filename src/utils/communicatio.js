const URLS = [
  "https://chat.openai.com/*",
  "https://claude.ai/*",
  "https://www.bing.com/*",
  "https://bard.google.com/*",
  "https://yiyan.baidu.com/*",
  "https://www.baidu.com/*"
];


// popup页面发送的消息
export const sendPopupMessage = async (msg)=>{
  const tabs = await chrome.tabs.query({url: URLS});
  const titles = [], errs = [];
  let resnum = 0;
  tabs.forEach(tab=>{
    chrome.tabs.sendMessage(tab.id, {type: 'popupMessage', data: msg}).catch(err=>{
      titles.push(`${ tab.title }页-自动刷新失败，请手动刷新。`);
      errs.push(err);
    }).finally(()=>{
      if (++resnum >= URLS.length) {
        alert(titles.jsin('、'));
        console.log(titles.jsin('、'), errs);
      }
    })
  })
}

// 处理接收到的消息
export const receiveMessage = (callback)=>{
  chrome.runtime.onMessage.addListener((message) => {
    (message.type === 'popupMessage' && message.data?.code === 0) && callback();
  });
}

