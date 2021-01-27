class Recorder {
  constructor(userName, stream) {
    this.userName = userName;
    this.stream = stream;

    this.filename = `id:${userName}-whew:${Date.now()}`;

    this.videoType = "video/webm";
    this.mediaRecorder = {};
    this.recorderBlobs = [];
    this.recordingActive = false;
    this.completeRecordings = [];
  }

  _setup() {
    const commonCodecs = ["codecs=vp9,opus", "codecs=vp8,opus", ""];

    const options = commonCodecs
      .map((codec) => ({ mimeType: `${this.videoType};${codec}` }))
      .find((options) => MediaRecorder.isTypeSupported(options.mimeType));

    if (!options) {
      throw new Error(`none of the codecs: ${commonCodecs.join(",")} are supported`);
    }
    return options;
  }

  startRecording() {
    console.log("recording", this.userName, this.filename);

    const options = this._setup();

    if (!this.stream.active) return;

    this.mediaRecorder = new MediaRecorder(this.stream, options);
    console.log(`created mediaRecorder ${this.mediaRecorder} with options ${options}`);

    this.mediaRecorder.onstop = (event) => {
      console.log(`record blobs`, this.recorderBlobs);
    };

    this.mediaRecorder.ondataavailable = (event) => {
      if (!event.data || !event.data.size) return;

      this.recorderBlobs.push(event.data);
    };

    this.mediaRecorder.start();
    console.log("start recording video", this.mediaRecorder);
    this.recordingActive = true;
  }

  async stopRecording() {
    if (!this.recordingActive) return;
    if (!this.mediaRecorder.state === "inactive") return;

    console.log("stop recording video", this.userName);
    this.mediaRecorder.start();
    this.recordingActive = false;

    await Util.sleep(200);

    this.completeRecordings.push([...this.recorderBlobs]);
    this.recorderBlobs = [];
  }
}
