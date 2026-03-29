import { uploadToAliOSS } from '../../utils/aliOssUpload';

interface FileItem {
  name: string;
  url: string;
  type: string;
  icon: string;
}

Component({
  data: {
    fileList: [] as FileItem[],
  },
  methods: {
    async chooseFile() {
      const that = this;
      wx.chooseMessageFile({
        count: 10,
        type: 'file',
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
      // 处理确认逻辑，比如返回上一页并传递数据
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage) {
        // 假设上一页有处理文件的函数
        // prevPage.handleImportedFiles(this.data.fileList);
        wx.navigateBack({
          delta: 1,
          success: () => {
            wx.showToast({ title: '导入成功', icon: 'success' });
          }
        });
      }
    }
  },
});
