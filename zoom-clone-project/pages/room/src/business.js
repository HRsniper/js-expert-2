class Business {
  constructor({ room, media, view }) {
    this.room = room;
    this.media = media;
    this.view = view;

    this.currentStream = {};
  }

  static initialize(dependencies) {
    const instance = new Business(dependencies);
    return instance._init();
  }

  // privado
  async _init() {
    this.currentStream = await this.media.getCamera();
    this.addVideoStream("test");
  }

  addVideoStream(userId, stream = this.currentStream) {
    const isCurrentUser = false;
    this.view.renderVideo({ userId, stream, isCurrentUser });
  }
}
