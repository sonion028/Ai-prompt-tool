// 1、改文件在编译前自动执行。通过manifest.json中的host_permissions字段。修改注入文件的域名列表。
// 2、重写manifest.json文件
// 3、重写同步文件中的域名列表。


// 写文件
const path = require('path');
const fs = require('fs');


class BuildPrev{
  constructor(){
    // 读取manifest.json文件
    this.manifestFilePath = path.join(__dirname, '../manifest.json'); // manifest.json 路径
    this.communicatioFilePath = path.join(__dirname, '../src/utils/communicatio.js'); // utils/communicatio.js 路径
    this.bgFilePath = path.join(__dirname, '../src/background/bg.js'); // background/bg.js 路径
    this.manifest = require(this.manifestFilePath); // 读取manifest.json 因为都依赖这个文件，所以在构造函数中读取
  }

  init(){
    this.rewriteManifest();
    this.rewriteCommunication();
    this.rewriteBg();
  }

  /**
   * @msg: 重写manifest.json文件
   */  
  rewriteManifest(){
    const packageJson = require(path.join(__dirname, '../package.json'));  // 读package.json
    ({ version: this.manifest.version, description: this.manifest.description } = packageJson); // 拷贝version和description

    this.manifest.content_scripts[0].matches = this.manifest.host_permissions; // 注入代码
    this.manifest.web_accessible_resources[0].matches = this.manifest.host_permissions; // 注入资源
    // 重写 manifest.json 文件
    this.rewriteFile(this.manifestFilePath, JSON.stringify(this.manifest, null, 2));
  }

  /**
   * @msg: 重写消息同步组件 utils/communicatio.js文件
   */  
  rewriteCommunication(){
    let jsString = this.readFile(this.communicatioFilePath);
    jsString = jsString.replace(/(const URLS = )\[[^\];]*\](;)/, `$1${ JSON.stringify(this.manifest.host_permissions, null, 2) }$2`)
    this.rewriteFile(this.communicatioFilePath, jsString);
  }

  // 重写background/bg.js
  rewriteBg(){
    let jsString = this.readFile(this.bgFilePath);
    // 用url列表生成代码段
    const urlStr = this.manifest.host_permissions.map(item=>{
      return `new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: '${ new URL(item).host }' }
      })`;
    }).join(',\r\n');
    // 替换原本的代码段
    jsString = jsString.replace(/const conditions = \[[^\];]+\];/, `const conditions = [${ urlStr }];`);
    this.rewriteFile(this.bgFilePath, jsString);
  }

  /**
   * @Author: sonion
   * @msg: 读取文件内容，用同步api，避免异步传导
   * @param {*} filePath
   * @return {*}
   */  
  readFile(filePath){
    return fs.readFileSync(filePath, 'utf-8')
  }

  /**
 * @Author: sonion
 * @msg: 重写文件
 * @param {String} filePathName 输出文件相对路径和名称
 * @param {String} fileContent 输出文件内容
 * @return {*}
 */
  rewriteFile(filePath, fileContent){
    const tempFilePath = filePath + '.tmp';
    fs.writeFile(tempFilePath, fileContent, { encoding: 'utf8', mode: 0o666, flag: 'w' }, (err) => {
      if (err) {
        this.deleteFile(tempFilePath); // 写入错误 尝试删除临时文件
        throw err
      };
      fs.rename(tempFilePath, filePath, (err) => {
        if (err) {
          this.deleteFile(tempFilePath); // 重命名错误 尝试删除临时文件
          throw err
        };
        console.log(filePath + ' 文件已更新!!!');
      });
    });
  }

  /**
   * @Author: sonion
   * @msg: 如果文件存在，则删除
   * @param {*} filePath
   * @return {*}
   */  
  deleteFile(filePath){
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (!err) {
        // 删除文件
        fs.unlink(filePath, (err) => {
            if (err) throw err;
            console.log(`${ filePath } 文件删除失败，如有必要可尝试手动删除`);
        });
      }
    });
  }
}

const buildPrev = new BuildPrev();
buildPrev.init();