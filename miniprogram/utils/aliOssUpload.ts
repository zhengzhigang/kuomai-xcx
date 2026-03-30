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
const GET_OSS_TOKEN_PATH = '/api/common/public/aliyun/getStsToken';

// 缓存 OSS Token
let ossToken: OssToken | null = null;

/**
 * 从后端获取 OSS 临时上传凭证
 * @param cookie - 用于身份验证的 cookie 或 token
 */
async function getToken(cookie: string, fileName: string): Promise<OssToken> {
  // 简单的缓存策略，可以根据 expiration 字段判断是否过期
  if (ossToken && new Date(ossToken.expiration) > new Date()) {
    return ossToken;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${GET_OSS_TOKEN_PATH}`,
      method: 'GET',
      data: {
        contentType: '9005',
        ext: fileName || '简历',
        needTranVideo: '0'
      },
      header: {
        'Content-Type': 'application/json',
        // 根据你的项目实际情况传递身份凭证
        'maitoken': cookie, // 鉴权字段，根据实际情况调整
      },
      success(res: any) {
        if (res.statusCode === 200 && res.data.code === 0) {
          const item = res.data.data;
          if (item?.accessKeyId && item.accessKeySecret && item.securityToken) {
            ossToken = {
              accessKeyId: item.accessKeyId,
              accessKeySecret: item.accessKeySecret,
              securityToken: item.securityToken,
              expiration: item.expiration || '',
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
 * 生成基于日期的唯一对象键
 * @param originalName - 原始文件名
 */
function getObjectName(originalName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');

  // 由于之前你要求不使用 md5，这里使用时间戳+随机数模拟原有代码中的 hash 部分
  const timestamp = now.getTime();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop() || '';

  return `uploads/${year}/${month}/${day}/${timestamp}_${randomStr}.${ext}`;
}

/**
 * 改造后的主处理函数，适用于小程序
 * @param file - 小程序文件对象
 * @param contentType - 文件内容类型 (如 'image/jpeg')
 */
export async function uploadToAliOSS(filePath: string, originalName: string): Promise<string> {
  try {
    // 1. 获取用户身份凭证（示例）
    const userToken = wx.getStorageSync('_userToken') || '';

    // 2. 获取 OSS 临时凭证
    const token = await getToken(userToken, originalName);

    // const client = new OSS({
    //   region: 'oss-cn-beijing',
    //   accessKeyId: token.accessKeyId,
    //   accessKeySecret: token.accessKeySecret,
    //   stsToken: token.securityToken,
    //   bucket: token.bucketName,
    //   secure: true // 强制 HTTPS
    // })

    // let buffer
    // const fs = wx.getFileSystemManager();
    // try {
    //   // 直接返回 ArrayBuffer
    //   buffer = fs.readFileSync(filePath);
    //   console.log('同步读取成功:', buffer);
    // } catch (err) {
    //   console.error('同步读取失败:', err);
    // }

    // const streamLikeBuffer = {
    //   stream: buffer, // 将 buffer 包装在 stream 属性下
    //   type: 'application/octet-stream' // 强制指定类型
    // };

    // console.log('=====@@', buffer)
    // // 将文件上传到 OSS
    // const result = await client.put(token.key, streamLikeBuffer)

    // return result

    // 3. 准备上传参数
    const objectKey = getObjectName(originalName);
    const host = OSS_CONFIG.host;

    return new Promise((resolve, reject) => {
      console.log('$$$$$$$$$$', filePath)
      wx.uploadFile({
        url: host,
        filePath: filePath,
        name: 'file', // 必须与 OSS PostObject 请求中的 file 字段匹配
        formData: {
          key: token.key,                          // 文件路径
          OSSAccessKeyId: token.accessKeyId,       // STS临时AK
          "x-oss-security-token": token.securityToken, // STS必须参数
          success_action_status: "204"
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
          console.error('OSS Upload Error:', err);
          reject(new Error('文件上传失败'));
        },
      });
    });
  } catch (error: any) {
    console.error('OSS Upload Error:', error);
    wx.showToast({
      title: error.message || '上传失败',
      icon: 'none',
    });
    return Promise.reject(error);
  }
}