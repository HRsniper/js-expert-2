class Business {
  constructor({ room, media, view, socketBuilder, peerBuilder }) {
    this.room = room;
    this.media = media;
    this.view = view;

    this.socketBuilder = socketBuilder;
    this.peerBuilder = peerBuilder;

    this.currentStream = {};
    this.currentPeer = {};

    this.socket = {};

    this.peers = new Map();
    this.usersRecordings = new Map();
  }

  static initialize(deps) {
    const instance = new Business(deps);
    return instance._init();
  }

  // privado
  async _init() {
    this.view.configureRecordButton(this.onRecordPressed.bind(this));

    //                                    habilitando som
    // this.currentStream = await this.media.getCamera(true);
    this.currentStream = await this.media.getCamera();

    this.socket = this.socketBuilder
      .setOnUserConnected(this.onUserConnected())
      .setOnUserDisconnected(this.onUserDisconnected())
      .build();

    // sem await gera error
    this.currentPeer = await this.peerBuilder
      .setOnError(this.onPeerError())
      .setOnConnectionOpened(this.onPeerConnectionOpened())
      .setOnCallReceived(this.onPeerCallReceived())
      .setOnPeerStreamReceived(this.onPeerStreamReceived())
      .setOnCallError(this.onPeerCallError())
      .setOnCallClose(this.onPeerCallClose())
      .build();

    console.log("init", this.currentStream);
    this.addVideoStream(this.currentPeer.id);
  }

  addVideoStream(userId, stream = this.currentStream) {
    const recorderInstance = new Recorder(userId, stream);
    this.usersRecordings.set(recorderInstance.filename, recorderInstance);
    if (this.recordingEnabled) {
      recorderInstance.startRecording();
    }

    const isCurrentId = false;
    // this.view.renderVideo({ userId, muted: false, stream, isCurrentId });
    this.view.renderVideo({ userId, stream, isCurrentId });
  }

  onUserConnected() {
    return (userId) => {
      console.log("user connected!", userId);

      this.currentPeer.call(userId, this.currentStream);
    };
  }

  onUserDisconnected() {
    return (userId) => {
      console.log("user disconnected!", userId);

      if (this.peers.has(userId)) {
        this.peers.get(userId).call.close();
        this.peers.delete(userId);
      }

      this.view.setParticipants(this.peers.size);
      this.stopRecording(userId);
      this.view.removeVideoElement(userId);
    };
  }

  onPeerError() {
    return (error) => {
      console.error("error on peer!", error);
    };
  }

  onPeerConnectionOpened() {
    return (peer) => {
      const id = peer.id;
      console.log("peer!", peer);
      this.socket.emit("join-room", this.room, id);
    };
  }

  onPeerCallReceived() {
    return (call) => {
      console.log("answering call!", call);
      call.answer(this.currentStream);
    };
  }

  onPeerStreamReceived() {
    return (call, stream) => {
      const callerId = call.peer;
      this.addVideoStream(callerId, stream);
      this.peers.set(callerId, { call });
      this.view.setParticipants(this.peers.size);
    };
  }

  onPeerCallError() {
    return (call, error) => {
      console.log("an call error ocurred!", error);
      this.view.removeVideoElement(call.peer);
    };
  }

  onPeerCallClose() {
    return (call) => {
      console.log("call closed!", call.peer);
    };
  }

  onRecordPressed(recordingEnabled) {
    this.recordingEnabled = recordingEnabled;
    console.log("pressed recording!", recordingEnabled);

    for (const [key, value] of this.usersRecordings) {
      if (this.recordingEnabled) {
        value.startRecording();
        continue;
      }

      this.stopRecording(key);
    }
  }

  // se um usuário entrar e sair durante uma gravação
  // precisamos parar as gravações dele
  async stopRecording(userId) {
    const usersRecordings = this.usersRecordings;

    for (const [key, value] of usersRecordings) {
      const isContextUser = key.includes(userId);

      if (!isContextUser) continue;

      const rec = value;
      const isRecordingActive = rec.recordingActive;

      if (!isRecordingActive) continue;

      await rec.stopRecording();
      this.playRecordings(key);
    }
  }

  playRecordings(userId) {
    const user = this.usersRecordings.get(userId);
    const videosUrls = user.getAllVideoUrls();

    videosUrls.map((url) => {
      this.view.renderVideo({ url, userId });
    });
  }
}
