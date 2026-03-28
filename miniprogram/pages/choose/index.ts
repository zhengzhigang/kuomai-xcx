import { uploadToAliOSS } from '../../utils/aliOssUpload';

Component({
  data: {},
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

      let successCount = 0;
      let failCount = 0;

      const uploadPromises = files.map(file => {
        return uploadToAliOSS(file.path, file.name)
          .then(url => {
            console.log(`文件 ${file.name} 上传成功，URL: ${url}`);
            successCount++;
          })
          .catch(err => {
            console.error(`文件 ${file.name} 上传失败:`, err);
            failCount++;
          });
      });

      await Promise.all(uploadPromises);

      wx.hideLoading();

      if (failCount === 0) {
        wx.showToast({
          title: `成功上传 ${successCount} 个文件`,
          icon: 'success'
        });
      } else {
        wx.showModal({
          title: '上传结果',
          content: `上传完成。成功: ${successCount}, 失败: ${failCount}`,
          showCancel: false
        });
      }
    }
  },
});
