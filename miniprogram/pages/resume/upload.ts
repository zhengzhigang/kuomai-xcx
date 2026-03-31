import { uploadToAliOSS } from '../../utils/aliOssUpload';
import { BASE_URL } from '../../utils/config';

interface FileItem {
  name: string;
  url: string;
  type: string;
  icon: string;
}

Component({
  data: {
    fileList: [] as FileItem[],
    success: false
  },
  methods: {
    async chooseFile() {
      const that = this;
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['.pdf', 'pdf', '.doc', 'doc', '.docx', 'docx'],
        async success(res) {
          const tempFiles = res.tempFiles;
          console.log('选择的文件：', tempFiles);
          await that.uploadFiles(tempFiles);
        },
        fail(err) {
          console.error('选择文件失败：', err);
        }
      });
    },
    async chooseImage() {
      const that = this;
      wx.chooseMessageFile({
        count: 10,
        type: 'image',
        async success(res) {
          const tempFiles = res.tempFiles;
          console.log('选择的图片：', tempFiles);
          await that.uploadFiles(tempFiles);
        },
        fail(err) {
          console.error('选择图片失败：', err);
        }
      });
    },
    async uploadFiles(files: any[]) {
      if (!files || files.length === 0) return;

      wx.showLoading({
        title: '正在上传...',
        mask: true
      });

      const newFiles: FileItem[] = [];
      const uploadPromises = files.map(file => {
        return uploadToAliOSS(file.path, file.name)
          .then(url => {
            const ext = file.name.split('.').pop()?.toLowerCase();
            let icon = '../../images/file-default.png'; // 需要准备这些图标
            if (ext === 'pdf') icon = '../../images/pdf-icon.png';
            else if (['doc', 'docx'].includes(ext!)) icon = '../../images/word-icon.png';
            else if (['jpg', 'jpeg', 'png'].includes(ext!)) icon = url; // 图片直接显示预览图

            newFiles.push({
              name: file.name,
              url: url,
              type: ext || '',
              icon: icon
            });
          })
          .catch(err => {
            console.error(`文件 ${file.name} 上传失败:`, err);
          });
      });

      await Promise.all(uploadPromises);
      wx.hideLoading();

      if (newFiles.length > 0) {
        this.setData({
          fileList: [...this.data.fileList, ...newFiles]
        });
      }
    },
    deleteFile(e: any) {
      const index = e.currentTarget.dataset.index;
      const fileList = [...this.data.fileList];
      fileList.splice(index, 1);
      this.setData({ fileList });
    },
    previewFile(e: any) {
      const url = e.currentTarget.dataset.url;
      wx.showLoading({ title: '正在打开文档...' });

      // 只有 pdf, word, excel, ppt 等支持预览
      const ext = url.split('.').pop()?.toLowerCase();
      if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
        wx.downloadFile({
          url: url,
          success: (res) => {
            wx.openDocument({
              filePath: res.tempFilePath,
              success: () => console.log('打开文档成功'),
              fail: (err) => wx.showToast({ title: '暂不支持预览此格式', icon: 'none' })
            });
          },
          complete: () => wx.hideLoading()
        });
      } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
        wx.previewImage({
          current: url,
          urls: [url]
        });
        wx.hideLoading();
      } else {
        wx.hideLoading();
        wx.showToast({ title: '该格式不支持预览', icon: 'none' });
      }
    },
    confirmUpload() {
      const resumeFile = this.data.fileList[0].url
      const resumeName = this.data.fileList[0].name
      const userToken = wx.getStorageSync('_userToken') || '';
      wx.showLoading({
        title: '上传中...'
      })
      wx.request({
        url: `${BASE_URL}/api/resume/createResume`,
        method: 'POST',
        data: {
          resumeName,
          resumeFile
        },
        header: {
          'Content-Type': 'application/json',
          // 根据你的项目实际情况传递身份凭证
          'maitoken': userToken, // 鉴权字段，根据实际情况调整
        },
        success: (res: any) => {
          if (res.data.code === 0) {
            this.setData({
              success: true
            })
            wx.showToast({
              title: '上传成功',
              icon: 'success',
              duration: 2000 // 2000毫秒 = 2秒，之后会自动关闭
            })
          }
          wx.hideLoading()
        },
        fail(err) {
          wx.hideLoading()
          console.log('err', err)
        },
      });
    }
  },
});
