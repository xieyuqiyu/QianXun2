<template>
    <transition name="message-fade">
      <div v-if="visible" class="message" :class="typeClass">
        <div class="message-content">
          <i class="message-icon" :class="iconClass"></i>
          <span class="message-text">{{ message }}</span>
        </div>
      </div>
    </transition>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  
  const props = defineProps({
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'info'
    },
    duration: {
      type: Number,
      default: 3000
    }
  });
  
  const visible = ref(false);
  
  const typeClass = computed(() => {
    return `message-${props.type}`;
  });
  
  const iconClass = computed(() => {
    const iconMap = {
      success: 'icon-success',
      warning: 'icon-warning',
      error: 'icon-error',
      info: 'icon-info'
    };
    return iconMap[props.type] || 'icon-info';
  });
  
  onMounted(() => {
    visible.value = true;
    if (props.duration > 0) {
      setTimeout(() => {
        visible.value = false;
      }, props.duration);
    }
  });
  </script>
  
  <style scoped>
  .message {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    pointer-events: none;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    min-width: 300px;
  }
  
  .message-content {
    display: flex;
    align-items: center;
  }
  
  .message-icon {
    margin-right: 10px;
    font-size: 18px;
    display: inline-block;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    text-align: center;
    line-height: 24px;
  }
  
  .message-text {
    font-size: 14px;
    font-weight: 500;
  }
  
  .message-success {
    background: rgba(82, 196, 26, 0.1);
    color: #52c41a;
  }
  
  .message-success .message-icon::before {
    content: '✓';
  }
  
  .message-warning {
    background: rgba(250, 173, 20, 0.1);
    color: #faad14;
  }
  
  .message-warning .message-icon::before {
    content: '!';
  }
  
  .message-error {
    background: rgba(245, 34, 45, 0.1);
    color: #f5222d;
  }
  
  .message-error .message-icon::before {
    content: '×';
  }
  
  .message-info {
    background: rgba(24, 144, 255, 0.1);
    color: #1890ff;
  }
  
  .message-info .message-icon::before {
    content: 'i';
  }
  
  .message-fade-enter-active,
  .message-fade-leave-active {
    transition: opacity 0.3s, transform 0.3s;
  }
  
  .message-fade-enter-from,
  .message-fade-leave-to {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  </style>