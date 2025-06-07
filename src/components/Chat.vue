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
  bottom: 0;
  right: 0;
  width: 100%;
  background-color: #2c2f33;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: height 0.3s ease;
  height: 3rem;
  overflow: hidden;
  z-index: 1000;
}

.chat-expanded {
  height: 60vh;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.10);
  border-top: 0.06rem solid rgba(255, 255, 255, 0.15);
  border-top-right-radius: 10px;
  cursor: pointer;
}

.chat-header h3 {
  color: #ffffff;
  margin: 0;
}

.chat-header-icons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.model-selector {
  color: #ffffff;
  cursor: pointer;
  position: relative;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 0.85rem;
}

.model-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #36393f;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
  min-width: 120px;
}

.model-option {
  padding: 0.5rem 1rem;
  color: #ffffff;
  transition: background 0.2s;
}

.model-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.model-option.selected {
  background: #5b6eae;
}

.icon-settings::before,
.icon-close::before,
.icon-send::before,
.icon-add::before {
  content: '';
  display: inline-block;
  width: 1rem;
  height: 1rem;
  background-size: cover;
}

.icon-settings::before {
  background-image: url('/path/to/settings-icon.svg');
}

.icon-close::before {
  background-image: url('/path/to/close-icon.svg');
}

.icon-send::before {
  background-image: url('/path/to/send-icon.svg');
}

.icon-add::before {
  background-image: url('/path/to/add-icon.svg');
}

.chat-body {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
}

.chat-message {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 5px;
  max-width: 75%;
  position: relative;
}

.user-message {
  background-color: #7289da;
  color: #ffffff;
  border-radius: 20px 0 20px 0;
  margin-left: auto;
}

.ai-message {
  background-color: #bbc7dc;
  color: #000000;
  border-radius: 0 20px 0 20px;
  margin-right: auto;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.loading-dots {
  display: inline-block;
  position: relative;
  width: 64px;
  height: 8px;
}

.loading-dots:after {
  content: '...';
  display: inline-block;
  animation: dots 1.5s infinite;
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
}

.chat-footer {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.10);
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.chat-footer input {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 5px;
  margin-right: 1rem;
  background: rgba(255, 255, 255, 0.10);
  color: #ffffff;
}

.chat-footer input::placeholder {
  color: #b9bbbe;
}

.chat-footer input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.send-button,
.add-button {
  background-color: #7289da;
  border: none;
  border-radius: 5px;
  /* padding: 0.5rem; */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  margin-right: 1rem;
}

.send-button:hover,
.add-button:hover {
  background-color: #5b6eae;
}

.send-button:disabled {
  background-color: #4f5b79;
  cursor: not-allowed;
  opacity: 0.7;
}

.options-dropdown {
  position: absolute;
  bottom: 100%;
  right: 0;
  background: #36393f;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
  min-width: 120px;
  margin-bottom: 0.5rem;
}

.option {
  padding: 0.5rem 1rem;
  color: #ffffff;
  transition: background 0.2s;
  white-space: nowrap;
}

.option:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 添加 Markdown 内容的样式 */
.message-content {
  line-height: 1.5;
}

.message-content :deep(pre) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
}

.message-content :deep(code) {
  font-family: 'Courier New', monospace;
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.1rem 0.2rem;
  border-radius: 3px;
}

.message-content :deep(a) {
  color: #7289da;
  text-decoration: none;
}

.message-content :deep(a:hover) {
  text-decoration: underline;
}

.message-content :deep(ul), .message-content :deep(ol) {
  margin-left: 1rem;
}

.message-content :deep(blockquote) {
  border-left: 4px solid #7289da;
  margin-left: 0;
  padding-left: 1rem;
  opacity: 0.8;
}

.message-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
}

.message-content :deep(th), .message-content :deep(td) {
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
}

.ai-message .message-content :deep(a) {
  color: #4766c9;
}

.user-message .message-content :deep(a) {
  color: #ffffff;
}

/* 添加流式响应相关样式 */
.streaming .cursor {
  display: inline-block;
  width: 7px;
  height: 15px;
  background-color: currentColor;
  margin-left: 1px;
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
</style>