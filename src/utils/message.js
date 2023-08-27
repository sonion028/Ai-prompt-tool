import { h } from './util.js';


class _MyMessage{
	// 消息组件类
	constructor(){
		this.duration = 3500; // 默认显示持续时长
		this.timer = null; //定时器
		this.isShow = false; // 消息显示状态
		this.cssUrl = 'https://dev.jrcaifang.com/css/iconfont.css'; // 图标字体文件路径
		this._init(); // 执行创建
	};

	h = h; // 类vue h函数

	_init(){
		// 创建显示组建件
		let link = h('link', null, null, document.head);
		link.rel = 'stylesheet';
		link.href = this.cssUrl;
		// 注入css   //需要不单独引入css和字体文件时开启上边这4句
		this._messageBox = h('dialog', {class: 'my-message-modal-dialog'});
		this._messageInner = h('div', {class: 'inner'}, null, this._messageBox); // 文字图标容器
		this._messageIcon = h('i', {class: 'icon'}, null, this._messageInner); // 图标
		this._messageContent = h('p', {class: 'content'}, null, this._messageInner); //文字内容
		this._controlCenter = h('div', {class: 'control-center'}, null, this._messageBox); // button容器
		this._cancelButton = h('button', {class: 'cancel'}, null, this._controlCenter); // 取消
		this._confirmButton = h('button', {class: 'confirm'}, null ,this._controlCenter); // 确认
		document.body.appendChild(this._messageBox);
	};

	_show(content, color) {
		// 公共显示
		if(typeof content === 'object'){
			this._messageContent.innerHTML = ''; // 清除原有内容
			this._messageContent.appendChild(content);
		}else this._messageContent.innerText = content;
		this._messageIcon.style.color = color; //图标颜色
		this._messageBox.showModal();
		this.isShow = true; // 消息显示状态，是
	}

	_showMessage(type, content, duration, color) {
		// 显示普通消息。msg:消息内容, color:显示颜色, duration:持续显示时长
		switch (type) {
			case 'success':
				this._messageIcon.className = 'icon iconfont icon-success';
				break;
			case 'error':
				this._messageIcon.className = 'icon iconfont icon-error';
				break;
			default:
				// 如果不靠左不用加icon。直接：iconfont icon-warn
				this._messageIcon.className = 'icon iconfont icon-warn';
		};
		this._closeConfirmMessage(); // 可能之前显示过确认消息，所以先取消一下
		this._show(content, color); // 设置外边框的样式、消息内容、图标颜色、计算剧中的位置
		this.timer = setTimeout(() => {
			this._closeMessage(); // 关闭消息
		}, duration || this.duration);
	};

	_showConfirmMessage(content){
		// 显示确认消息 // 内容 是否html元素 
		this._closeMessage(); // 可能正在显示普通消息，避免关闭时，连带关闭确认消息
		this._controlCenter.style.display = 'flex';
		this._show(content, 'rgb(249, 176, 25)');
		this._messageIcon.className = 'icon iconfont icon-help';
	}

	_close(){
		// 通用关闭
		this._messageBox.close();
		this.isShow = false; // 消息显示状态，否
	}

	_closeMessage(){ 
		// 关闭普通消息
		this._close();
		clearTimeout(this.timer); // 取消自动关闭
		this.timer = null;
	}

	_closeConfirmMessage(){
		// 关闭确认消息
		this._messageContent.innerHTML = ''; // 清除元素
		this._controlCenter.style.display = 'none';
		this._close();
	}

	success(content, duration) {
		this._showMessage('success', content || '完成', duration, 'rgb(97, 196, 121)');
	};

	warning(content, duration) {
		this._showMessage('warning', content || '未知警告', duration, 'rgb(249, 176, 25)'); // 原颜色 rgb(248, 206, 74);
	};

	error(content, duration) {
		this._showMessage('error', content || '未知错误', duration, 'rgb(225, 80, 66)');
	}
	/**
	 * @Author: sonion
	 * @msg: 需确认的消息
	 * @param {String|Element} content 消息内容字符串或Dom对象，可用h函数(用法同vue)实例自带，也可居名导入
	 * @param {String} confirmText 确认文字
	 * @param {String} cancelText 取消文字
	 * @param {Function} confirmCallback 确认事件函数
	 * @param {Function} cancelCallback 取消事件函数
	 */
	confirm({ content, confirmText, cancelText, confirmCallback, cancelCallback }){
		this._cancelButton.textContent = cancelText || '取消';
		this._confirmButton.textContent = confirmText || '确定';
		this._confirmButton.onclick = ()=>{
			// 不用addEventListener因为下次可以直接覆盖，而不用取消之前的事件
			this._closeConfirmMessage(); // 先执行关闭，避免回掉有bug导致不能关闭弹窗
			confirmCallback && confirmCallback(); // 确认事件
		}
		this._cancelButton.onclick = ()=>{ 
      this._closeConfirmMessage();
			cancelCallback && cancelCallback(); // 取消事件
		}
		this._messageBox.onkeydown = (e)=>{
			if(e.key === 'Enter'){
        this.isShow && this._confirmButton.click(); // 键盘确认
			}else if (e.key === 'Escape'){
        this.isShow && this._cancelButton.click(); // 键盘取消
			}
		};
		this._showConfirmMessage(content); // 显示确认消息
		this._messageContent.tabIndex = '1'; // 获取键盘事件焦点
		this._messageContent.focus(); // 获取焦点
	}
}

function singleton(className){
	// 单例模式，生成函数
	let ins;
	return new Proxy(className, {
		construct(target, args){
			if (!ins)ins = new target(...args);
			return ins;
		}
	})
};


const MyMessage = singleton(_MyMessage); // 单例生成


export {
	MyMessage,
	h
};
