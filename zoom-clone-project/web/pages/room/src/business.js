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
  }

  static initialize(deps) {
    const instance = new Business(deps);
    return instance._init();
  }

  // privado
  async _init() {
    //                                    habilitando som
    this.currentStream = await this.media.getCamera(true);

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
      .build();

    console.log("init", this.currentStream);
    this.addVideoStream("test01");
  }

  addVideoStream(userId, stream = this.currentStream) {
    const isCurrentId = false;
    this.view.renderVideo({ userId, muted: false, stream, isCurrentId });
  }

  onUserConnected = function () {
    return (userId) => {
      console.log("user connected!", userId);

      this.currentPeer.call(userId, this.currentStream);
    };
  };

  onUserDisconnected = function () {
    return (userId) => {
      console.log("user disconnected!", userId);
    };
  };

  onPeerError = function () {
    return (error) => {
      console.log("error on peer!", error);
    };
  };

  onPeerConnectionOpened = function () {
    return (peer) => {
      const id = peer.id;
      console.log("peer!", peer);
      this.socket.emit("join-room", this.room, id);
    };
  };

  onPeerCallReceived = function () {
    return (call) => {
      console.log("answering call!", call);
      call.answer(this.currentStream);
    };
  };

  onPeerStreamReceived = function () {
    return (call, stream) => {
      const callerId = call.peer;
      this.addVideoStream(callerId, stream);
    };
  };
}
