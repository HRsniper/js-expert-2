class PeerBuilder {
  constructor({ peerConfig }) {
    this.peerConfig = peerConfig;

    const defaultFunctionValue = () => {};

    this.onError = defaultFunctionValue;
    this.onCallReceived = defaultFunctionValue;
    this.onConnectionOpened = defaultFunctionValue;
    this.onPeerStreamReceived = defaultFunctionValue;
  }

  setOnError(fn) {
    this.onError = fn;
    // retorna a instância da classe para chamar as outras funções da classe
    return this;
  }

  setOnCallReceived(fn) {
    this.onCallReceived = fn;
    // retorna a instância da classe para chamar as outras funções da classe
    return this;
  }

  setOnConnectionOpened(fn) {
    this.onConnectionOpened = fn;
    // retorna a instância da classe para chamar as outras funções da classe
    return this;
  }

  setOnPeerStreamReceived(fn) {
    this.onPeerStreamReceived = fn;
    // retorna a instância da classe para chamar as outras funções da classe
    return this;
  }

  _prepareCallEvent(call) {
    call.on("stream", (stream) => {
      this.onPeerStreamReceived(call, stream);
    });

    this.onCallReceived(call);
  }

  build() {
    const peer = new Peer(...this.peerConfig);

    peer.on("error", this.onError);
    peer.on("call", this._prepareCallEvent.bind(this));

    return new Promise((resolve) => {
      peer.on("open", (id) => {
        this.onConnectionOpened(peer);
        return resolve(peer);
      });
    });
  }
}
