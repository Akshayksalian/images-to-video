/**
 * images-to-video class
 * creater：qc
 * reference：1、https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
 * 2、https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API
 */
class ImagesToVideo {
  // Gotic instance (DOM object)
  canvas = null; // document.getElementById('myCanvas')
  // Pain (rendering above)
  ctx = null;
  // Recording media examples
  mediaRecord = null;
  // Store image streaming container
  chunks = new Set();
  // Inquiry drawing time device
  timer = null;

  // Configuration attribute
  option = {
    intervals: 100, // Video grasping interval milliseconds
    drawIntervals: 1000, // Rotating drawing drawing interval in milliseconds
    // Note that the list of FileList has been packaged and processed. It is not [Object File], but the object {file: file, name: file.name, src: url.createObjectUrl (file)}
    fileList: [], // List of local picture objects selected
    fileDownload: {
      // Video download configuration
      fileType: `mp4`,
      fileName: `video`,
    },
  };

  /**
   * Constructor
   */
  constructor(canvas, option = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.option = { ...this.option, ...option };
    this.initMedia();
  }

  /**
   * Initialize recording media instance objects
   */
  initMedia() {
    console.log("initMedia start");
    // Get the canvas Canvaselement and set the frame frequency (FPS)
    const mediaStream = this.canvas.captureStream(48);
    // Core API, you can record Canvas, Audio, Video
    // PS: You can also record the browser screen, you can pass MediaDevices.getDisplayMedia() Come to get the screen content such as
    // const mediaStream = await navigator.mediaDevices.getDisplayMedia({video: true})
    this.mediaRecord = new MediaRecorder(mediaStream, {
      videoBitsPerSecond: 8500000,
    });
    // Receive data
    this.mediaRecord.ondataavailable = (e) => {
      this.chunks.add(e.data);
    };
    console.log("initMedia end");
  }

  /**
   * Draw the picture to the canvas
   */
  async drawImage(file) {
    try {
      console.log("drawImage file", file);
      const src =
        Object.prototype.toString.call(file) === "[object File]"
          ? URL.createObjectURL(file)
          : file.src;
      // Draw a picture stream
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          // this.ctx.drawImage(img, 0, 0, img.width, img.height)
          this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
          // resolve(true)
        };
        img.src = src;
      });
    } catch (error) {
      console.log("drawImage error", error);
    } finally {
      console.log("drawImage finally");
    }
  }

  /**
   * Start the screen recording, the real list calls
   */
  async startRecord() {
    // The parameter is the grip of milliseconds, the default 100 milliseconds
    this.mediaRecord && this.mediaRecord.start(this.option.intervals || 100);
    // Rotation drawing
    let index = 0;
    this.timer && clearInterval(this.timer);
    return await new Promise((resolve) => {
      this.timer = setInterval(() => {
        const file = this.option.fileList[index] || null;
        file
          ? this.drawImage(file) && (index += 1)
          : resolve(this.stopRecord());
      }, this.option.drawIntervals || 1000);
    });
  }

  /**
   * Stop screening and return video objects
   * @returns Object {name, blob, src}
   */
  stopRecord() {
    this.timer && clearInterval(this.timer);
    this.mediaRecord && this.mediaRecord.stop();
    // Generate video blob
    const type = `${this.option.fileDownload.fileType || "mp4"}`;
    const name = `${this.option.fileDownload.fileName || "video"}.${type}`;
    const blob = new Blob(this.chunks, {
      type: `video/${type}`,
    });
    const src = URL.createObjectURL(blob);
    return { name, blob, src };
  }
}
