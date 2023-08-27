import { h } from '../utils/message.js';
import { AiPrompt } from "./main";



// chatGPT
class OpenAiPrompt extends AiPrompt {
  constructor(){
    super();
    this.observerAddEvent();
  }

  // 监听变化 添加换行和清除所有
  observerAddEvent(){
    this.clearAll();
    const mutationObserver = new MutationObserver((mutationRecords, observer)=>{
      for(const record of mutationRecords){
        if (record.addedNodes.length){
          for (const node of record.addedNodes){
            if (record.target?.id === '__next' && node.querySelector('main')){
              // 删除对话 内容全重新渲染 主容器重新监听
              observer.observe(node.querySelector('main'), { childList: true });
            }
            
            if (node.querySelector('form')){
              // 切花对话， 添加清除和换行事件
              queueMicrotask(()=>this.clearAll())
            }
          }
        }
      }
    })
    mutationObserver.observe(document.querySelector('#__next'), { childList: true });
    mutationObserver.observe(document.querySelector('main'), { childList: true });
  }
}



class ClaudeAiPrompt extends AiPrompt {
  constructor(){
    super();
    this.observerAddEvent();
  }

  // 监听变化 添加换行和清除所有
  observerAddEvent(){
    this.clearAll();
    const mutationObserver = new MutationObserver((mutationRecords, observer)=>{
      for(const record of mutationRecords){
        if (record.addedNodes.length){
          for (const node of record.addedNodes){
            if (node.querySelector('fieldset')){
              this._el = node.querySelector('fieldset>div>div>div');
              this.clearAll(this._el);
            }else if(node.querySelector('[role="status"]')){
              observer.observe(node, { childList: true });
            }
          }
        }
      }
    })
    mutationObserver.observe(document.body, { childList: true });
  }

  getTextArea(){
    return (this._el || document).querySelector('div[contenteditable=true]');
  }

  // 重写 使用提示词事件处理函数
  usePromptHandler = (target) => {
    const textAreaBox = this.getTextArea();
    textAreaBox.insertBefore(h('p', { 
      innerText: target.tagName === 'P' ? target.innerText : target.children[0].innerText 
    }), textAreaBox.lastChild);
    textAreaBox.focus();
  }

  // 重写 清除所有事件处理函数
  clearAllHandler = (e)=>{
    e.stopPropagation();
    const textAreaBox = this.getTextArea();
    textAreaBox.innerHTML = '';
  }
}



// new bing
class BingAiPrompt extends AiPrompt {
  constructor(){
    super();
  }

  // 重写init
  init(){
    super.init();
    this.shadowRootInjectStyle(); // 为#shadow-root注入css
    this.clearAll(this.getTextInputBox().querySelector('.root')); // 添加换行和清除所有 ,因为加载的时候监听过了
  }

  // 为#shadow-root注入css
  shadowRootInjectStyle(){
    this.getTextInputBox().appendChild(h('style', { 
      type: 'text/css', // 清除所有内容的样式
      innerText: `.clear-all-content { position: absolute; top: -8px; right: 0; z-index: 9;
        width: 15px; height: 15px; line-height: 15px; border-radius: 50%; transform: rotateZ(45deg); 
        text-align: center;font-size: 15px;font-style: normal; background-color: #0000001a; cursor: pointer;
        font-family: "Microsoft YaHei", "Avenir", "Helvetica", "Arial", "Heiti SC", "sans-serif"; }`
      })
    );
  }

  // 获取textarea的根元素
  getTextInputBox() {
    return document.getElementsByClassName('cib-serp-main')?.[0].shadowRoot.getElementById('cib-action-bar-main')
    .shadowRoot;
  }

  // 获取输入的textarea
  getTextArea() {
    return this.getTextInputBox().querySelector('cib-text-input').shadowRoot.querySelector('textarea');
  }
};



class BardAiPrompt extends AiPrompt {
  constructor(){
    super();
    this.clearAll(); // 添加换行和清除所有 ,因为加载的时候监听过了
  }

  clearAll(){
    super.clearAll(this.getTextArea().parentElement.parentElement)
  }
}



class BaiduAiPrompt extends AiPrompt {
  constructor(){
    super();
    this.clearAll(); // 添加换行和清除所有 ,因为加载的时候监听过了
  }

  clearAll(el){
    super.clearAll();
    const textAreaBox = el || this.getTextArea();
    textAreaBox.parentElement.style.overflow = 'visible'; // 文心父元素溢出隐藏“清除所有”的解决办法
    this.newLine(textAreaBox); // 文心"换行"要自己添加
  }

  // 换行 // 其他平台不需要
  newLine(textAreaBox){
    let isDown = false;
    textAreaBox.addEventListener('keyup', e=>{
      e.stopPropagation();
      e.preventDefault();
      (e.code === 'ShiftRight'|| e.code === 'ShiftLeft') && (isDown = false);
    }, true); // 捕获阶段，避免bing原本的事件执行
    textAreaBox.addEventListener('keydown', e=>{
      if (e.code === 'ShiftRight' || e.code === 'ShiftLeft'){
        e.stopPropagation();
        e.preventDefault();
        isDown = true;
      }else if (isDown && e.code === 'Enter'){
        // e.preventDefault();
        e.stopPropagation();
        const target = e.target;
        target.value += '\n';
        this.triggerInputEvent(textAreaBox);
        return false; // 取消冒泡
      }
    }, true); // 捕获阶段，避免bing原本的事件执行
  }
}



// 文心一言
class ErnieAiPrompt extends BaiduAiPrompt{
  constructor(){
    super()
  }

  clearAll(){
    super.clearAll(this.getTextArea().parentElement)
  }
}


export {
  OpenAiPrompt,
  ClaudeAiPrompt,
  BingAiPrompt,
  BardAiPrompt,
  BaiduAiPrompt,
  ErnieAiPrompt,
}