<template>
  <div class="chat-container" :class="{ 'chat-expanded': isExpanded }">
    <div class="chat-header" @click="toggleChat">
      <h3>AI助手</h3>
      <div class="chat-header-icons">
        <span class="model-selector" @click.stop="showModelSelector = !showModelSelector">
          {{ currentModelName }}
          <div class="model-dropdown" v-if="showModelSelector">
            <div 
              v-for="model in availableModels" 
              :key="model.id" 
              class="model-option"
              :class="{ 'selected': model.id === currentModel }"
              @click="selectModel(model.id)"
            >
              {{ model.name }}
            </div>
          </div>
        </span>
        <span class="icon-settings"></span>
        <span class="icon-close" @click.stop="closeChat"></span>
      </div>
    </div>
    <div class="chat-body" ref="chatBody">
      <div 
        v-for="message in messages" 
        :key="message.id" 
        class="chat-message"
        :class="{ 'user-message': message.isUser, 'ai-message': !message.isUser }"
      >
        <div class="message-header">
          <span class="message-sender">{{ message.isUser ? '我' : currentModelName }}</span>
          <span class="message-time">{{ message.time }}</span>
        </div>
        <!-- 用户消息显示纯文本 -->
        <p v-if="message.isUser">{{ message.text }}</p>
        <!-- AI消息显示Markdown -->
        <div v-else-if="!message.isStreaming && message.text" class="message-content" v-html="renderMarkdown(message.text)"></div>
        <!-- 流式响应时显示文本内容和光标 -->
        <div v-else-if="message.isStreaming" class="message-content streaming">
          <span v-html="renderMarkdown(message.text)"></span><span class="cursor"></span>
        </div>
        <!-- 空消息状态显示加载动画 -->
        <div class="message-status" v-if="!message.text && !message.isUser">
          <span class="loading-dots"></span>
        </div>
      </div>
    </div>
    <div class="chat-footer">
      <input 
        type="text" 
        v-model="inputMessage" 
        placeholder="输入消息..." 
        @keydown.enter="sendMessage"
        :disabled="isProcessing"
      />
      <button @click="sendMessage" class="send-button" :disabled="isProcessing">
        <span class="icon-send">发送消息</span>
      </button>
      <button class="add-button" @click.stop="showOptions = !showOptions">
        <span class="icon-add">清除对话</span>
        <div class="options-dropdown" v-if="showOptions">
          <div class="option" @click="clearChat">清除对话</div>
          <div class="option" @click="exportChat">导出对话</div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { getAvailableModels, sendMessageToAI } from '../services/aiService';
import { marked } from 'marked'; // 引入 Markdown 解析库

// 状态变量
const messages = ref([
  { id: 1, text: '您好！我是您的AI助手，有什么我可以帮您的呢？', isUser: false, time: formatTime(new Date()) }
]);
const inputMessage = ref('');
const isExpanded = ref(false);
const chatBody = ref(null);
const isProcessing = ref(false);
const currentModel = ref('deepseek'); // 默认使用ChatGPT
const showModelSelector = ref(false);
const showOptions = ref(false);
const availableModels = ref(getAvailableModels());

// 计算属性
const currentModelName = computed(() => {
  const model = availableModels.value.find(m => m.id === currentModel.value);
  return model ? model.name : 'AI助手';
});

// 格式化时间的函数
function formatTime(date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 发送消息
const sendMessage = async () => {
  if (inputMessage.value.trim() === '' || isProcessing.value) return;
  
  const userMessage = inputMessage.value;
  inputMessage.value = '';
  
  // 添加用户消息
  messages.value.push({ 
    id: messages.value.length + 1, 
    text: userMessage, 
    isUser: true,
    time: formatTime(new Date())
  });
  
  // 添加AI正在输入的消息
  const loadingMsgId = messages.value.length + 1;
  messages.value.push({ 
    id: loadingMsgId, 
    text: '', // 初始为空，将用于流式显示
    isUser: false, 
    isStreaming: true, // 标记为流式响应状态
    time: formatTime(new Date())
  });
  
  // 滚动到底部
  scrollToBottom();
  
  // 设置处理中状态
  isProcessing.value = true;
  
  try {
    // 调用AI服务，传入回调函数以处理流式响应
    const response = await sendMessageToAI(
      currentModel.value, 
      userMessage,
      // 流式响应的回调函数
      (chunk, fullText) => {
        const messageIndex = messages.value.findIndex(msg => msg.id === loadingMsgId);
        if (messageIndex !== -1) {
          // 更新消息文本，保留 isStreaming 状态
          messages.value[messageIndex].text = fullText;
          scrollToBottom();
        }
      }
    );
    
    // 完成后更新最终消息状态
    const messageIndex = messages.value.findIndex(msg => msg.id === loadingMsgId);
    if (messageIndex !== -1) {
      messages.value[messageIndex] = {
        ...messages.value[messageIndex],
        isStreaming: false, // 流式响应完成
        text: response.success ? response.message : '抱歉，发生了错误，请稍后再试。'
      };
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    const messageIndex = messages.value.findIndex(msg => msg.id === loadingMsgId);
    if (messageIndex !== -1) {
      messages.value[messageIndex] = {
        id: loadingMsgId,
        text: '抱歉，发生了错误，请稍后再试。',
        isUser: false,
        isStreaming: false,
        time: formatTime(new Date())
      };
    }
  } finally {
    isProcessing.value = false;
    scrollToBottom();
  }
};

// 选择模型
const selectModel = (modelId) => {
  currentModel.value = modelId;
  showModelSelector.value = false;
  
  // 添加模型切换的系统消息
  messages.value.push({ 
    id: messages.value.length + 1, 
    text: `已切换到 ${availableModels.value.find(m => m.id === modelId).name}`,
    isUser: false,
    isSystem: true,
    time: formatTime(new Date())
  });
  
  scrollToBottom();
};

// 清除对话
const clearChat = () => {
  messages.value = [
    { id: 1, text: '您好！我是您的AI助手，有什么我可以帮您的呢？', isUser: false, time: formatTime(new Date()) }
  ];
  showOptions.value = false;
};

// 导出对话
const exportChat = () => {
  const chatContent = messages.value
    .map(msg => `${msg.isUser ? '用户' : currentModelName.value} (${msg.time}):\n${msg.text}`)
    .join('\n\n');
  
  const blob = new Blob([chatContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AI对话记录_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  
  showOptions.value = false;
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatBody.value) {
      chatBody.value.scrollTop = chatBody.value.scrollHeight;
    }
  });
};

// 打开/关闭聊天窗口
const toggleChat = () => {
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value) {
    scrollToBottom();
  }
};

// 关闭聊天窗口
const closeChat = () => {
  isExpanded.value = false;
};

// Markdown 渲染函数
const renderMarkdown = (text) => {
  try {
    return marked.parse(text);
  } catch (e) {
    console.error('Markdown 解析错误:', e);
    return text;
  }
};
</script>

<style scoped>
@font-face {
  font-family: "zhuzi";
  src: url("../assets/fonts/ZhuZiAWan-2.ttc") format("truetype");
  font-weight: normal;
  font-style: normal;
}

.chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  background: rgba(26, 32, 44, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  height: 60px;
  overflow: hidden;
  z-index: 1000;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-expanded {
  height: 600px;
  width: 1420px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px 16px 0 0;
  cursor: pointer;
  transition: background 0.3s ease;
  position: relative;
}

.chat-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.chat-header h3 {
  color: #ffffff;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.chat-header-icons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.model-selector {
  color: #ffffff;
  cursor: pointer;
  position: relative;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.15);
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.model-selector:hover {
  background: rgba(99, 102, 241, 0.25);
  transform: translateY(-1px);
}

.model-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(30, 39, 54, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  z-index: 20;
  min-width: 140px;
  overflow: hidden;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.model-option {
  padding: 12px 16px;
  color: #ffffff;
  transition: all 0.2s ease;
  font-size: 14px;
  cursor: pointer;
}

.model-option:hover {
  background: rgba(255, 255, 255, 0.08);
}

.model-option.selected {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

.icon-settings,
.icon-close {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  padding: 4px;
}

.icon-settings:hover,
.icon-close:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.icon-settings::before {
  content: '⚙';
  font-size: 14px;
}

.icon-close::before {
  content: '✕';
  font-size: 12px;
}

.chat-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.1);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.chat-body::-webkit-scrollbar {
  width: 6px;
}

.chat-body::-webkit-scrollbar-track {
  background: transparent;
}

.chat-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.chat-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-message {
  margin-bottom: 16px;
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-message {
  display: flex;
  justify-content: flex-end;
}

.user-message .message-content,
.user-message p {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 18px 18px 4px 18px;
  max-width: 80%;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  word-wrap: break-word;
}

.ai-message {
  display: flex;
  justify-content: flex-start;
}

.ai-message .message-content,
.ai-message p {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 18px 18px 18px 4px;
  max-width: 80%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  word-wrap: break-word;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 11px;
  opacity: 0.6;
  color: #a0aec0;
}

.message-sender {
  font-weight: 600;
}

.message-time {
  font-weight: 400;
}

.message-status {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}
.loading-dots {
  background: rgba(255, 255, 255, 0.08);
  padding: 12px 16px;
  border-radius: 18px 18px 18px 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  min-width: 60px;
  display: flex;
  align-items: center;
}

.loading-dots::after {
  content: '';
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chat-footer {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0 0 16px 16px;
  gap: 12px;
}

.chat-footer input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 14px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.chat-footer input:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.chat-footer input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.chat-footer input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-button,
.add-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover,
.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.send-button:active,
.add-button:active {
  transform: translateY(0);
}

.send-button:disabled {
  background: rgba(255, 255, 255, 0.1);
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
  box-shadow: none;
}

.options-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  background: rgba(30, 39, 54, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  z-index: 20;
  min-width: 140px;
  overflow: hidden;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.option {
  padding: 12px 16px;
  color: #ffffff;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 14px;
  cursor: pointer;
}

.option:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Markdown 内容样式优化 */
.message-content {
  line-height: 1.6;
}

.message-content :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.message-content :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.message-content :deep(a) {
  color: #a5b4fc;
  text-decoration: none;
  transition: color 0.2s ease;
}

.message-content :deep(a:hover) {
  color: #c7d2fe;
  text-decoration: underline;
}

.message-content :deep(ul), 
.message-content :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.message-content :deep(li) {
  margin: 4px 0;
}

.message-content :deep(blockquote) {
  border-left: 3px solid #667eea;
  margin: 8px 0;
  padding-left: 16px;
  opacity: 0.9;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 0 6px 6px 0;
  padding: 8px 16px;
}

.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3) {
  color: #ffffff;
  margin: 12px 0 8px 0;
  font-weight: 600;
}

.message-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  border-radius: 6px;
  overflow: hidden;
}

.message-content :deep(th), 
.message-content :deep(td) {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  text-align: left;
}

.message-content :deep(th) {
  background: rgba(255, 255, 255, 0.1);
  font-weight: 600;
}

/* 流式响应样式 */
.streaming .cursor {
  display: inline-block;
  width: 2px;
  height: 18px;
  background: linear-gradient(to bottom, #667eea, #764ba2);
  margin-left: 2px;
  animation: blink 1s infinite;
  border-radius: 1px;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-container {
    right: 10px;
    bottom: 10px;
    width: calc(100vw - 20px);
    max-width: 400px;
  }
  
  .chat-expanded {
    width: calc(100vw - 20px);
    max-width: 420px;
    height: 70vh;
  }
}

/* 暗色主题优化 */
@media (prefers-color-scheme: dark) {
  .chat-container {
    background: rgba(17, 24, 39, 0.95);
  }
}
</style>