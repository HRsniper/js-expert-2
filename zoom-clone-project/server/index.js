const http = require("http");
const socketIO = require("socket.io");

const server = http.createServer((request, response) => {
  response.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET"
  });

  response.end("server Running");
});

const io = socketIO(server, {
  cors: {
    origin: "*",
    credentials: false
  }
});

io.on("connection", (socket) => {
  // console.log("connection", socket);

  socket.on("join-room", (roomId, userId) => {
    console.log(`connected => user: ${userId} room: ${roomId}`);
    // adicionar usuários na mesma sala
    socket.join(roomId);

    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("disconnect", () => {
      console.log(`disconnected => user: ${userId} room: ${roomId}`);
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

const startServer = () => {
  const { address, port } = server.address();
  console.info(`started server at ${address}:${port}`);
};

server.listen(process.env.PORT || 3000, startServer);
