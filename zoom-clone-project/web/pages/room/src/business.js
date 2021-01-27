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
      .setOnCallError(this.onPeerCallError())
      .setOnCallClose(this.onPeerCallClose())
      .build();

    console.log("init", this.currentStream);
    this.addVideoStream(this.currentPeer.id);
  }

  addVideoStream(userId, stream = this.currentStream) {
    const isCurrentId = false;
    this.view.renderVideo({ userId, muted: false, stream, isCurrentId });
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
      this.view.removeVideoElement(userId);
    };
  }

  onPeerError() {
    return (error) => {
      console.log("error on peer!", error);
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
      console.log("call close!", call.peer);
    };
  }
}
