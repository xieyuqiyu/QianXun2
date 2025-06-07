import axios from 'axios';

// AI模型配置
const models = {
  chatgpt: {
    name: 'ChatGPT',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`
    },
    formatRequest: (message) => ({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
      stream: true // 启用流式响应
    }),
    formatResponse: (data) => data.choices[0].message.content
  },
  deepseek: {
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY || ''}`
    },
    formatRequest: (message) => ({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: message }],
      stream: true // 启用流式响应
    }),
    formatResponse: (data) => data.choices[0].message.content
  }
};

export const getAvailableModels = () => {
  return Object.keys(models).map(key => ({
    id: key,
    name: models[key].name
  }));
};

export const sendMessageToAI = async (modelId, message, onChunk) => {
  try {
    const model = models[modelId];
    if (!model) {
      throw new Error('模型不存在');
    }

    const response = await fetch(model.apiUrl, {
      method: 'POST',
      headers: model.headers,
      body: JSON.stringify(model.formatRequest(message)),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || '请求失败');
    }

    // 处理流式响应
    if (!response.body) {
      throw new Error('浏览器不支持流式响应');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let completeResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      
      // 处理不同 API 的流式响应格式
      if (modelId === 'chatgpt') {
        // OpenAI 格式: data: {...}\n\ndata: {...}\n\n
        const lines = chunk.split('\n\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                completeResponse += content;
                onChunk(content, completeResponse);
              }
            } catch (e) {
              console.error('解析响应出错:', e);
            }
          }
        }
      } else if (modelId === 'deepseek') {
        // DeepSeek 格式可能与 OpenAI 类似，根据实际情况调整
        // 这里假设格式相同
        const lines = chunk.split('\n\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                completeResponse += content;
                onChunk(content, completeResponse);
              }
            } catch (e) {
              console.error('解析响应出错:', e);
            }
          }
        }
      }
    }

    return {
      success: true,
      message: completeResponse || '回复为空'
    };
  } catch (error) {
    console.error('AI API调用失败:', error);
    return {
      success: false,
      message: '抱歉，AI服务暂时不可用，请稍后再试。' + (error.message ? ` (${error.message})` : '')
    };
  }
};