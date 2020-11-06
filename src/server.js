import express from "express";
import http from "http";
import { Server as SocketIoServer } from "socket.io"

const app = express();
const server = http.createServer(app);
const sockets = new SocketIoServer(server);

app.use(express.static("public"));

sockets.on("connection", socket => {
    const playerId = socket.id
    console.log(`Player connected on Server with id: ${playerId}`)
});

server.listen(3000, () => {
  console.log("Server listening on port: 3000");
});
