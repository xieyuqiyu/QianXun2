import { createApp } from 'vue';
import MessageComponent from '../components/Message.vue';

// 消息提示函数
const Message = (options) => {
  // 如果传入的是字符串，则将其作为消息内容
  if (typeof options === 'string') {
    options = {
      message: options
    };
  }
  
  // 创建一个div作为容器
  const messageNode = document.createElement('div');
  document.body.appendChild(messageNode);
  
  // 创建消息组件实例
  const messageApp = createApp(MessageComponent, {
    ...options,
    onClose: () => {
      // 关闭后移除DOM
      messageApp.unmount();
      document.body.removeChild(messageNode);
    }
  });
  
  // 挂载组件
  messageApp.mount(messageNode);
  
  // 返回关闭方法
  return {
    close: () => {
      messageApp.unmount();
      document.body.removeChild(messageNode);
    }
  };
};

// 添加不同类型的消息方法
['success', 'warning', 'error', 'info'].forEach(type => {
  Message[type] = (options) => {
    if (typeof options === 'string') {
      options = {
        message: options
      };
    }
    options.type = type;
    return Message(options);
  };
});

// 添加确认对话框功能
Message.confirm = (message, title = '提示', options = {}) => {
  return new Promise((resolve, reject) => {
    // 创建对话框容器
    const confirmNode = document.createElement('div');
    confirmNode.className = 'custom-confirm-container';
    document.body.appendChild(confirmNode);
    
    // 创建对话框内容
    const confirmContent = document.createElement('div');
    confirmContent.className = 'custom-confirm-content';
    
    // 创建标题
    const titleElement = document.createElement('div');
    titleElement.className = 'custom-confirm-title';
    titleElement.textContent = title;
    
    // 创建消息
    const messageElement = document.createElement('div');
    messageElement.className = 'custom-confirm-message';
    messageElement.textContent = message;
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'custom-confirm-buttons';
    
    // 创建取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.className = 'custom-confirm-cancel';
    cancelButton.textContent = options.cancelButtonText || '取消';
    cancelButton.onclick = () => {
      document.body.removeChild(confirmNode);
      reject(new Error('用户取消'));
    };
    
    // 创建确认按钮
    const confirmButton = document.createElement('button');
    confirmButton.className = 'custom-confirm-ok';
    confirmButton.textContent = options.confirmButtonText || '确定';
    confirmButton.onclick = () => {
      document.body.removeChild(confirmNode);
      resolve();
    };
    
    // 组装对话框
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    confirmContent.appendChild(titleElement);
    confirmContent.appendChild(messageElement);
    confirmContent.appendChild(buttonContainer);
    confirmNode.appendChild(confirmContent);
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .custom-confirm-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      .custom-confirm-content {
        background: rgba(30, 30, 30, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 20px;
        width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      .custom-confirm-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
        color: white;
      }
      .custom-confirm-message {
        margin-bottom: 20px;
        color: rgba(255, 255, 255, 0.8);
      }
      .custom-confirm-buttons {
        display: flex;
        justify-content: flex-end;
      }
      .custom-confirm-cancel, .custom-confirm-ok {
        padding: 8px 16px;
        margin-left: 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s;
      }
      .custom-confirm-cancel {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
      .custom-confirm-cancel:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .custom-confirm-ok {
        background: ${options.type === 'warning' ? 'rgba(255, 59, 48, 0.8)' : 'rgba(0, 122, 255, 0.8)'};
        color: white;
      }
      .custom-confirm-ok:hover {
        background: ${options.type === 'warning' ? 'rgba(255, 59, 48, 1)' : 'rgba(0, 122, 255, 1)'};
      }
    `;
    document.head.appendChild(style);
    
    // 添加ESC键关闭功能
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(confirmNode);
        document.removeEventListener('keydown', handleKeyDown);
        reject(new Error('用户取消'));
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  });
};

export default Message;