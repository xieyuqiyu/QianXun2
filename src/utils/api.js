// API请求封装
import { getApiBaseUrl } from './env';

// 获取基础URL
const baseURL = getApiBaseUrl();

/**
 * 封装GET请求
 * @param {string} url - 请求路径
 * @param {Object} params - 请求参数
 * @returns {Promise} - 返回Promise对象
 */
export const get = async (url, params = {}) => {
  try {
    // 构建查询字符串
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    // 拼接完整URL
    const fullUrl = `${baseURL}${url}${queryString ? `?${queryString}` : ''}`;
    
    // 发送请求
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }
    
    // 解析响应数据
    return await response.json();
  } catch (error) {
    console.error('GET请求出错:', error);
    throw error;
  }
};

/**
 * 封装POST请求
 * @param {string} url - 请求路径
 * @param {Object} data - 请求数据
 * @returns {Promise} - 返回Promise对象
 */
export const post = async (url, data = {}) => {
  try {
    // 发送请求
    const response = await fetch(`${baseURL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }
    
    // 解析响应数据
    return await response.json();
  } catch (error) {
    console.error('POST请求出错:', error);
    throw error;
  }
};
/**
 * 封装PUT请求
 * @param {string} url - 请求路径
 * @param {Object} data - 请求数据
 * @returns {Promise} - 返回Promise对象
 */
export const put = async (url, data = {}) => {
  try {
    // 发送请求
    const response = await fetch(`${baseURL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`更新失败: ${response.status}`);
    }
    
    // 解析响应数据
    return await response.json();
  } catch (error) {
    console.error('PUT请求出错:', error);
    throw error;
  }
};



/**
 * 封装DELETE请求
 * @param {string} url - 请求路径
 * @returns {Promise} - 返回Promise对象
 */
export const del = async (url) => {
  try {
    // 发送请求
    const response = await fetch(`${baseURL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`删除失败: ${response.status}`);
    }
    
    // 解析响应数据
    return await response.json();
  } catch (error) {
    console.error('DELETE请求出错:', error);
    throw error;
  }
};

/**
 * 封装文件上传请求
 * @param {string} url - 请求路径
 * @param {FormData} formData - 表单数据
 * @returns {Promise} - 返回Promise对象
 */
export const upload = async (url, formData) => {
  try {
    // 发送请求
    const response = await fetch(`${baseURL}${url}`, {
      method: 'POST',
      body: formData,
    });
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`上传失败: ${response.status}`);
    }
    
    // 解析响应数据
    return await response.json();
  } catch (error) {
    console.error('上传请求出错:', error);
    throw error;
  }
};

/**
 * 获取图片完整URL
 * @param {string} path - 图片路径
 * @returns {string} - 完整URL
 */
export const getImageUrl = (path) => {
  // 如果路径已经是完整URL或是本地导入的资源，则直接返回
  if (!path || path.startsWith('http') || path.startsWith('data:') || typeof path === 'object') {
    return path;
  }
  
  // 否则拼接基础URL和路径
  return `${baseURL}${path}`;
};

/**
 * 格式化URL，确保包含协议前缀
 * @param {string} url - 原始URL
 * @returns {string} - 格式化后的URL
 */
export const formatUrl = (url) => {
  if (!url) return '#';
  
  // 如果URL已经包含协议前缀，则直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 否则添加https://前缀
  return `https://${url}`;
};