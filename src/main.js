import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Message from './utils/message'
import { getAppTitle } from './utils/env'


// 设置文档标题
document.title = getAppTitle()

const app = createApp(App)

// 全局挂载消息组件
app.config.globalProperties.$message = Message

// 添加到全局
window.$message = Message

app.mount('#app')