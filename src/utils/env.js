// 环境配置工具

/**
 * 获取当前环境
 * @returns {string} 当前环境名称
 */
export const getEnv = () => {
  return import.meta.env.MODE;
};

/**
 * 判断是否是开发环境
 * @returns {boolean}
 */
export const isDev = () => {
  return import.meta.env.MODE === 'development';
};

/**
 * 判断是否是生产环境
 * @returns {boolean}
 */
export const isProd = () => {
  return import.meta.env.MODE === 'production';
};

/**
 * 获取环境变量
 * @param {string} key - 环境变量键名
 * @param {any} fallback - 默认值
 * @returns {string} 环境变量值
 */
export const getEnvValue = (key, fallback = '') => {
  return import.meta.env[key] || fallback;
};

/**
 * 获取API基础URL
 * @returns {string} API基础URL
 */
export const getApiBaseUrl = () => {
  return getEnvValue('VITE_API_BASE_URL', '');
};

/**
 * 获取应用标题
 * @returns {string} 应用标题
 */
export const getAppTitle = () => {
  return getEnvValue('VITE_APP_TITLE', '千寻导航');
};