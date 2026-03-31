/**
 * 小程序全局配置文件
 */

// 开发环境还是生产环境
const isDev = true;

// 统一的接口请求基础地址
export const BASE_URL = isDev ? 'https://www.kuomai360.com' : 'https://www.kuomai360.com';

// 业务服务器上传接口路径
export const UPLOAD_PATH = '/api/upload'; // 根据实际情况修改，例如 /api/upload 或 /api/common/public/aliyun/upload

// 其他全局配置
export const OSS_CONFIG = {
  bucket: 'kuomai',
  region: 'oss-cn-beijing',
  host: `https://kuomai.oss-cn-beijing.aliyuncs.com`
};
