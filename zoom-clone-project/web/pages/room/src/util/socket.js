class SocketBuilder {
  constructor({ socketUrl }) {
    this.socketUrl = socketUrl;
    this.onUserConnected = () => {};
    this.onUserDisconnected = () => {};
  }

  setOnUserConnected(fn) {
    this.onUserConnected = fn;
    // retorna a instância da classe para chamar as outras funções da classe
    return this;
  }

  setOnUserDisconnected(fn) {
    this.onUserDisconnected = fn;
    // retorna a instância da classe para chamar as outras funções da classe
    return this;
  }

  build() {
    const socket = io.connect(this.socketUrl, { withCredentials: false });

    socket.on("user-connected", this.onUserConnected);
    socket.on("user-disconnected", this.onUserDisconnected);

    return socket;
  }
}
