/**
 * @Author: sonion
 * @msg: 解决了循环引用、原型一致的深度克隆
 * @param {Object|Array} value 要克隆的对象
 * @return {Object|Array}
 */
const deepClone = (value)=>{
  const cache = new WeakMap(); // 解决循环引用 weakMap不影响垃圾回收
  const _deepClone = (value)=>{
    if (value === null || typeof value !== 'object') return value;
    const result = Array.isArray(value) ? [] : {};
    if (cache.get(value)) return cache.get(value); // 解决循环引用
    Object.setPrototypeOf(result, Object.getPrototypeOf(value));
    cache.set(value, result); // 解决循环引用 把克隆过的保存，因为是引用对象克隆前保存就可以
    for (const [key, val] of Object.entries(value)){
      result[key] = _deepClone(val);
    }
    return result;
  }
  return _deepClone(value);
}


/**
 * @Author: sonion
 * @msg: 仿vue的函数创建Dom元素。接口同h函数一样，返回真实Dom元素。
 * @param {String} tag - 元素名，或html字符串
 * @param {Object} props - 元素属性，可选
 * @param {Array|Object|String} children - 子元素，可选。数组[[], {}]对象{}，字符串时创建的是文字节点。
 * @return {Element} Dom元素
 */
const h = (tag, props, children, parent)=>{
  if (typeof tag !== 'string') throw new Error('参数类型错误：tag 必须是字符串'+ tag);
  if (tag.startsWith('<') && tag.endsWith('>')){
    const parser = new DOMParser();
    const document = parser.parseFromString(tag, 'text/html');
    var el =  document.body.firstChild; // 获取转换后的 DOM 对象
  }else{
    const regExp = /^[a-z]+[a-z\d]*$/;
    if (!regExp.test(tag)) throw new DOMException(`参数类型错误${ tag }`);
    var el = document.createElement(tag);
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (['textContent', 'innerText', 'innerHTML'].includes(key)){
          el[key] = value;
        } else if (key === 'className') {
          el.className = value;
        } else if (key === 'style') {
          if (typeof value === 'string') {
            el.style.cssText = value;
          } else if (typeof value === 'object') {
            el.style.cssText = Object.entries(value).reduce((tempStr, [key, val])=>{
              return tempStr += `;${ key }:${ val }`
            }, '');
          }
        } else {
          el.setAttribute(key, value);
        }
      }
    }
    if (children) {
      if (Array.isArray(children)) {
        for (let child of children) {
          if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
          } else if (typeof child === 'object') {
            if (!Array.isArray(child)) child = [child.tag, child.props, child.children];
            el.appendChild(h(...child));
          }
        }
      } else if (typeof children === 'string') {
        el.appendChild(document.createTextNode(children));
      } else if (typeof children === 'object') {
        el.appendChild(h(children.tag, children.props, children.children));
      }
    }
  }
  el && parent && parent.appendChild(el); // 设置父元素
  return el;
}

export {
  deepClone,
  h
}
