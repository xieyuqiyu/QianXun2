<template>
    <div class="chat-container" :class="{ 'chat-expanded': isExpanded }">
        <div class="chat-header" @click="toggleChat">
            <h3>AI助手</h3>
            <div class="chat-header-icons">
                <span class="icon-settings"></span>
                <span class="icon-close" @click.stop="closeChat"></span>
            </div>
        </div>
        <div class="chat-body" ref="chatBody">
            <div class="chat-message" v-for="message in messages" :key="message.id">
                <p>{{ message.text }}</p>
            </div>
        </div>
        <div class="chat-footer">
            <input type="text" v-model="inputMessage" placeholder="输入消息..." @keydown.enter="sendMessage" />
            <button @click="sendMessage" class="send-button">
                <span class="icon-send"></span>
            </button>
            <button class="add-button">
                <span class="icon-add"></span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const messages = ref([
    { id: 1, text: '您好！我是您的AI助手，有什么我可以帮您的呢？' }
])

const inputMessage = ref('')
const isExpanded = ref(false)
const chatBody = ref(null)

const sendMessage = () => {
    if (inputMessage.value.trim() !== '') {
        messages.value.push({ id: messages.value.length + 1, text: inputMessage.value })
        inputMessage.value = ''
        nextTick(() => {
            chatBody.value.scrollTop = chatBody.value.scrollHeight
        })
    }
}

const toggleChat = () => {
    isExpanded.value = !isExpanded.value
    if (isExpanded.value) {
        nextTick(() => {
            chatBody.value.scrollTop = chatBody.value.scrollHeight
        })
    }
}

const closeChat = () => {
    isExpanded.value = false
}
</script>

<style scoped>
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
    /* 默认高度 */
    overflow: hidden;
}

.chat-expanded {
    height: 60vh;
    /* 展开后的高度 */
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
    padding: 0.5rem;
    background-color: #40444b;
    border-radius: 5px;
    color: #ffffff;
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

.send-button,
.add-button {
    background-color: #7289da;
    border: none;
    border-radius: 5px;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.send-button:hover,
.add-button:hover {
    background-color: #5b6eae;
}
</style>