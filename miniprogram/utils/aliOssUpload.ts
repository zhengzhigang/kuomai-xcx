import { BASE_URL, OSS_CONFIG } from './config';

// 定义 OSS 配置和凭证的类型，匹配原有服务端 getToken 的返回结构
interface OssToken {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;
  key: string;
  bucketName: string;
}

// 获取 OSS 临时凭证的相对 API 路径
// const GET_OSS_TOKEN_PATH = '/api/common/public/aliyun/getStsToken';
const GET_OSS_TOKEN_PATH = '/api/common/public/aliyun/getTokenForMiniProgram';

// 缓存 OSS Token
let ossToken: OssToken | null = null;

/**
 * 从后端获取 OSS 临时上传凭证
 * @param cookie - 用于身份验证的 cookie 或 token
 */
async function getToken(cookie: string, fileName: string, suffix: string): Promise<OssToken> {
  // 简单的缓存策略，可以根据 expiration 字段判断是否过期
  if (ossToken && new Date(ossToken.expiration) > new Date()) {
    return ossToken;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${GET_OSS_TOKEN_PATH}`,
      method: 'GET',
      data: {
        ext: suffix,
        // contentType: '9005',
        // ext: fileName || '简历',
        // needTranVideo: '0'
      },
      header: {
        'Content-Type': 'application/json',
        // 根据你的项目实际情况传递身份凭证
        'maitoken': cookie, // 鉴权字段，根据实际情况调整
      },
      success(res: any) {
        if (res.statusCode === 200 && res.data.code === 0) {
          const item = res.data.data;
          if (item?.accessKeyId) {
            ossToken = {
              // key: item.key,
              // accessKeyId: item.accessKeyId,
              // accessKeySecret: item.accessKeySecret,
              // securityToken: item.securityToken,
              // expiration: item.expiration || '',
              accessKeyId: item.accessKeyId,
              key: item.key,
              policy: item.policy,
              signature: item.signature
            };
            resolve(ossToken!);
          } else {
            reject(new Error('Invalid OSS token response'));
          }
        } else {
          reject(new Error(`Failed to fetch OSS token: ${res.errMsg}`));
        }
      },
      fail(err) {
        console.error('Failed to fetch OSS token:', err);
        reject(new Error('获取OSS临时凭证失败，请稍后重试'));
      },
    });
  });
}

/**
 * 改造后的主处理函数，适用于小程序
 * @param file - 小程序文件对象
 * @param contentType - 文件内容类型 (如 'image/jpeg')
 */
export async function uploadToAliOSS(filePath: string, originalName: string): Promise<string> {
  const suffix = originalName.split('.')[1]

  try {
    // 1. 获取用户身份凭证（示例）
    const userToken = wx.getStorageSync('_userToken') || '';

    // 2. 获取 OSS 临时凭证
    const token = await getToken(userToken, originalName, suffix);
    const host = OSS_CONFIG.host;

    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: host,
        filePath: filePath,
        name: 'file', // 必须与 OSS PostObject 请求中的 file 字段匹配
        formData: {
          key: token.key,  //上传文件名称
          policy: token.policy,   //表单域
          OSSAccessKeyId: token.accessKeyId,
          signature: token.signature,
          success_action_status: "200"  //上传成功后响应状态码
        },
        success(res) {
          if (res.statusCode === 200) {
            const fileUrl = `${host}/${token.key}`;
            console.log(`文件上传成功: ${fileUrl}`);
            resolve(fileUrl);
          } else {
            reject(new Error(`Upload failed with status: ${res.statusCode}`));
          }
        },
        fail(err) {
          console.error('上传失败:', err);
          reject(new Error('文件上传失败'));
        },
      });
    });
  } catch (error: any) {
    console.error('上传失败2:', error);
    wx.showToast({
      title: error.message || '上传失败',
      icon: 'none',
    });
    return Promise.reject(error);
  }
}