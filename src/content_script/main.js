import { MyMessage, h } from '../utils/message.js';
import { receiveMessage } from '../utils/communicatio.js';

class Uilts {
  constructor(){}

  getStorage(key){
    return new Promise(resolve=>{
      chrome.storage.local.get([key], (result)=>{
        resolve(result)
      })
    })
  }

  // 获取提示词
  syncGetPrompts(){
    return this.getStorage('prompts').then(res=>res.prompts || [])
  }

  setStorage(data){
    return chrome.storage.local.set(data);
  }

  // 保存提示词
  syncSetPrompts(prompts){
    return this.setStorage({ prompts });
  }

  // 注入js
  injectScript(){
    h('script', {type: 'text/javascript', src: chrome.runtime.getURL('src/inject_script/index.js')}, null, document.head);
  }
}



class DomUilts extends Uilts {
  constructor(){
    super();
    this.prompts = null; // 提示词数组
    this.promptsElementInner = null; // 提示词ul元素
    this.container = null; // 插件所有容器
  }

  // 获取输入的textarea
  getTextArea(){
    return document.getElementsByTagName('textarea')?.[0];
  };

  // 主dom部分
  createMainDom(){
    this.container = h('div', {id: 'prompt-container'}, [
      [
        'div', {class: 'control-center'}, 
        [
          ['button', {class: 'add-btn item'}, [
            ['i', {class: 'iconfont icon-add'}],
            ['span', { innerText: '添加新提示词' }]
          ]]
        ]
      ],
    ]);
    this.promptsElementInner = h('ul', null, null, h('div', {class: 'prompt-box'}, null, this.container));
    document.body.appendChild(this.container);
    const cancelDefaultEvent = (e)=>e.stopPropagation();
    this.promptsElementInner.addEventListener('mousewheel', cancelDefaultEvent, true); // 滑动事件取消默认事件。防止bing关闭页面
    // 模拟hover显示
    const parentElement = this.promptsElementInner.parentElement;
    this.container.addEventListener('mouseenter', e=>parentElement.style.cssText = 'width: 100%;transform: scaleY(1);');
    this.promptsElementInner.addEventListener('mouseleave', e=>parentElement.style.cssText = '');
    this.container.addEventListener('mouseleave', e=>parentElement.style.cssText = '');
  };

  // 创建提示词Dom
  createItemDom(content){
    const li = h(
      'li', {class: 'item'}, [
        ['p', { textContent: content }], 
        ['i', { class:'del', textContent: '+' }]
      ]
    );
    this.setSortBtnEvent(h('i', { class: 'iconfont icon-sort' }, null, li), li); // 设置拖动事件
    return li;
  }

  // 提示词渲染
  promptRender(){
    const fragment = document.createDocumentFragment();
    for (const prompt of this.prompts){
      fragment.appendChild(this.createItemDom(prompt.title));
    }
    this.promptsElementInner.innerHTML = ''; // 清除原来的元素
    this.promptsElementInner.appendChild(fragment);
    this.promptsElementInner.style.cssText = `--promptFontSize: ${ this.PROMPT_FONT_SIZE }px;`;
    const parentElement = this.promptsElementInner.parentElement;
    // parentElement.scrollTop = parentElement.scrollHeight
    requestAnimationFrame(()=>parentElement.scrollTop = parentElement.scrollHeight); // 使滑动处于最后，应为是倒着的
  }

  // 创建input事件
  createInputEvent(){
    this.inputEvent = new Event('input', {
      bubbles: true,
      cancelable: true
    });
  }

  // 手动触发 input 事件
  triggerInputEvent(textarea){
    textarea.dispatchEvent(this.inputEvent);
  }
}



class AiPrompt extends DomUilts {
  constructor(){
    super();
    // 常量
    this.RIGHT = '20px'; // 整个提示词容器定位
    this.BOTTOM = '50px'; // 整个提示词容器定位
    this.LINE_HEIGHT = 30; // 提示词行号
    this.MARGIN_BOTTOM = 10; // 提示词间隔
    this.PROMPT_FONT_SIZE = 13;  // 提示词字体大小
    this.myMgs = new MyMessage();

    this.isSort = false; // 是否开始排序
    this.clientY = 0; // 排序开始Y坐标
    this.sortElement = null;  // 排序元素
    this.init();
  }

  // 初始化 设置默认值
  async init(){
    this.firstInstatllImportPrompts(); // 首次安装，导入常用提示词
    this.createMainDom();
    const right = localStorage.getItem('right') || localStorage.setItem('right', this.RIGHT) || this.RIGHT;
    const bottom = localStorage.getItem('bottom') || localStorage.setItem('bottom', this.BOTTOM) || this.BOTTOM;
    this.container.style.cssText = `--right:${ right };
    --bottom:${ bottom };
    --lineHeight: ${ this.LINE_HEIGHT }px;
    --marginBottom:${ this.MARGIN_BOTTOM }px;`;
    try {
      this.prompts = await this.syncGetPrompts();
    }catch(err){
      this.myMgs.warning(`读取提示词出错${ err.message }`); // 提示词初始化
      console.log('读取提示词出错', err);
    }
    this.promptRender();
    this.setUseDelete(this.promptsElementInner); // 设置点击使用和删除事件
    this.addPrompt(); // 添加新提示词事件
    this.setSortEndEvent(); // 排序事件
    this.acceptMessage(); // 接受消息，更新提示词显示
    this.createInputEvent(); // 创建input事件
  }

  // 首次安装导入推荐提示词
  firstInstatllImportPrompts(){
    this.getStorage('installed').then(res=>{
      if (res.installed === void(0)){
        fetch(chrome.runtime.getURL('public/recommend.json'))
        .then(response => response.json())
        .then(async data => {
          this.prompts = data.map(item=>({ title: item}));
          await this.syncSetPrompts(this.prompts);
          this.promptRender(); // 渲染
          this.setStorage({ installed: true }); // 记录，下次不再运行
        });
      }
    })
  }

  // 接受消息，更新提示词显示
  acceptMessage(){
    receiveMessage(()=>{
      this.syncGetPrompts().then(res=>{
        this.prompts = res;
        this.promptRender();
        this.myMgs.success('更新完成');
      }).catch(err=>{
        this.myMgs.warning('提示词渲染出错，需要手动刷新');
        console.warn('提示词渲染出错', err);
      })
    })
  };

  // 添加提示词
  addPrompt(){
    this.container.querySelector('.add-btn').addEventListener('click', (e)=>{
      e.stopPropagation();
      let el = h('div', null, [
        ['p', {innerText: '输入要添加的提示词'}],
        ['textarea', {class: 'enter-prompt', wrap: 'soft', rows: '3'}]
      ]);
      this.myMgs.confirm({
        content: el,
        confirmCallback: ()=>{
          const val = (el.children[1].value || '').trim();
          if (val){
            this.prompts.push({title: val});
            this.syncSetPrompts(this.prompts); // 保存
            this.promptsElementInner.appendChild(this.createItemDom(val)); // 添加这一项的dom
          }
          el = null;
        },
        cancelCallback: ()=>el = null,
      })
    })
  };

  // 使用提示词的处理函数 后面可能会重写
  usePromptHandler = (target) => {
    const textAreaBox = this.getTextArea();
    textAreaBox.value += target.tagName === 'P' ? target.innerText : target.children[0].innerText;
    this.triggerInputEvent && this.triggerInputEvent(textAreaBox); // 触发input事件 bing需要
    textAreaBox.focus() // 文心一言 textAreaBox.value赋值 后马上调用focus 赋值就会失败 触发自定义事件后再调用就没问题
  }

  // 使用和删除事件
  setUseDelete(el){
    // 删除提示词
    const deletePrompt = (e) => {
      this.syncGetPrompts().then(prompts=>{
        const prompt = e.target.previousElementSibling.innerText; // 获取要删除的
        this.prompts = prompts.filter(item=> item.title !== prompt);
        this.syncSetPrompts(this.prompts);
        e.target.parentElement.remove();
      }).catch(err=>this.myMgs.warning(`读取提示词出错${ err.message }`));
    }
    // 代理到ul上
    el.addEventListener('click', (e)=>{
      e.stopPropagation();
      if (['LI', 'P'].includes(e.target.tagName)) {
        this.usePromptHandler(e.target)
      } else if (e.target.className === 'del') {
        deletePrompt(e)
      }
    })
  }

  // 清除所有事件的处理函数
  clearAllHandler = (e)=>{
    e.stopPropagation();
    const textAreaBox = this.getTextArea();
    textAreaBox.value = '';
    this.triggerInputEvent && this.triggerInputEvent(textAreaBox); // 触发input事件 bing需要
  }

  // 清除输入框所有
  clearAll(parentElement){
    const clearBtn = h('i', { class: 'clear-all-content', innerText: '+' });
    clearBtn.addEventListener('click', this.clearAllHandler);
    parentElement = parentElement || this.getTextArea().parentElement; // 如没传parentElement就用textAreaBox.parentElement。 如bing
    parentElement.appendChild(clearBtn);
  }

  // 设置排序 结束事件
  setSortEndEvent(){
    this.promptsElementInner.addEventListener('mouseup', this.endHandler);
    this.promptsElementInner.addEventListener('touchend', this.endHandler);
  }

  // 设置移动按钮的事件
  setSortBtnEvent(sortBtn, child){
    // 开始
    sortBtn.addEventListener('mousedown', this.startHandler);
    sortBtn.addEventListener('touchstart', this.startHandler);
    // 结束
    child.addEventListener('mouseleave', this.endHandler);
    // 移动
    sortBtn.addEventListener('mousemove', this.moveHandler);
    sortBtn.addEventListener('touchmove', this.moveHandler);
  }

  // 移动开始事件函数
  startHandler = (e)=>{
    e.stopPropagation();
    if (e.target.className !== 'iconfont icon-sort') return;
    this.isSort = true;
    this.clientY = e.clientY;
    this.sortElement = e.target.tagName !== 'LI' ? e.target.parentElement : e.target;
  }

  // 排序结束 主体部分
  endFunc = ()=>{
    this.isSort = false;
    this.clientY = 0;
    this.sortElement && (this.sortElement.style.cssText = '');
    this.sortElement = null;
  };
  // 排序结束 事件处理函数
  endHandler = (e)=>{
    e.stopPropagation();
    this.endFunc();
  };

  // dom移动 localStorage排序 部分
  sortMove = (sibling)=>{
    this.sortElement.remove();
    this.promptsElementInner.insertBefore(this.sortElement, sibling);
    this.prompts = [];
    for (const li of this.promptsElementInner.children){
      this.prompts.push({ title: li.querySelector('p').innerText });
    }
    this.syncSetPrompts(this.prompts); // 保存
  };
  // 移动中 事件处理函数
  moveHandler = (e)=>{
    e.stopPropagation();
    if (!this.isSort) return;
    const y = this.clientY - (e.clientY || e.touches[0].clientY);
    this.sortElement.style.transform = `translateY(${ -y }px)`;
    if ((this.MARGIN_BOTTOM + this.LINE_HEIGHT) / 2 < Math.abs(y)) {
      if (y < 0){
        const sibling = this.sortElement.previousElementSibling;
        sibling && this.sortMove(sibling);
      } else {
        const sibling = this.sortElement.nextElementSibling?.nextElementSibling;
        this.sortMove(sibling);
      }
      this.endFunc();
    }
  }
};

export {
  AiPrompt
}