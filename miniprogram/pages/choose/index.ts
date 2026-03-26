// index.ts

Component({
  data: {},
  methods: {
    chooseFile() {
      wx.chooseMessageFile({
        count: 10,
        type: 'file',
        success(res) {
          // tempFilePath可以作为img标签的src属性显示图片
          const tempFilePaths = res.tempFiles
          console.log('选择的文件：', tempFilePaths)
          wx.showToast({
            title: `已选择${tempFilePaths.length}个文件`,
            icon: 'success'
          })
        },
        fail(err) {
          console.error('选择文件失败：', err)
        }
      })
    },
    chooseImage() {
      wx.chooseMessageFile({
        count: 10,
        type: 'image',
        success(res) {
          const tempFilePaths = res.tempFiles
          console.log('选择的图片：', tempFilePaths)
          wx.showToast({
            title: `已选择${tempFilePaths.length}张图片`,
            icon: 'success'
          })
        },
        fail(err) {
          console.error('选择图片失败：', err)
        }
      })
    }
  },
})
