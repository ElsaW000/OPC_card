// webview.js

Page({
  data: {
    url: ''
  },
  onLoad(options) {
    if (options.url) {
      this.setData({
        url: decodeURIComponent(options.url)
      });
    }
  },
  // 处理 webview 加载完成
  onLoadProgressChange(e) {
    // 可以在这里处理加载进度
  },
  // 处理消息
  onMessage(e) {
    // 处理来自 webview 的消息
  }
});
