import { createApp } from 'vue';
import MessageComponent from '../components/Message.vue';

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

export default Message;