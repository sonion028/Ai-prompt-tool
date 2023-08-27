import { sendPopupMessage } from '../utils/communicatio.js' 


(()=>{
  const fileInput = document.querySelector('#file-input');
  const importBtn = document.querySelector('.import');
  const exportBtn = document.querySelector('.export');
  const clearAllBtn = document.querySelector('.clear-all');
  const refreshRenderBtn = document.querySelector('.refresh-render');


  importBtn.addEventListener('click', ()=>fileInput.click());
  // 导入
  fileInput.addEventListener('change', (event) => {
    const reader = new FileReader();
    reader.readAsText(fileInput.files[0]);
    reader.onload = () => {
      fileInput.value = ''; // 清楚input值为下次导入做准备
      const data = JSON.parse(reader.result).map(item=> ({title: item}) );
      chrome.storage.local.get(['prompts'], (result) => {
        const prompts = result?.prompts || [];
        prompts.push(...data);
        chrome.storage.local.set({ 'prompts': prompts });
        sendPopupMessage({code: 0, msg: 'ok'}); // 发消息通知更新
      });
    };
    reader.onerror = ()=>fileInput.value = ''; // 清楚input值为下次导入做准备
  });


  // 导出子函数
  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    let aTag = document.createElement('a');
    aTag.href = url;
    aTag.download = filename;
    aTag.click();
    queueMicrotask(()=>{
      URL.revokeObjectURL(url);
      aTag.remove();
      aTag = null;
    })
  }

  // 导出
  exportBtn.addEventListener('click', ()=>{
    chrome.storage.local.get(['prompts'], (result) => {
      const prompts = result?.prompts || [];
      downloadJSON(prompts.map(item=>item.title), `Ai Prompt${ Date.now() }`)
    });
  });

  // 清除所有提示词
  clearAllBtn.addEventListener('click', ()=>{
    chrome.storage.local.set({ 'prompts': [] });
    sendPopupMessage({code: 0,msg: 'ok'}); // 发送消息，通知提示词重新渲染
  })

  // 刷新提示词渲染
  refreshRenderBtn.addEventListener('click', ()=>{
    sendPopupMessage({code: 0,msg: 'ok'}); // 发送消息，通知提示词重新渲染
  })
})();