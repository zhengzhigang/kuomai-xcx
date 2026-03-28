/**
 * 小程序全局配置文件
 */

// 开发环境还是生产环境
const isDev = true;

// 统一的接口请求基础地址
export const BASE_URL = isDev ? 'https://www.kuomai360.com' : 'https://www.kuomai360.com';

// 其他全局配置
export const OSS_CONFIG = {
  bucket: 'san-file',
  region: 'oss-cn-beijing',
  host: `https://san-file.oss-cn-beijing.aliyuncs.com`
};
