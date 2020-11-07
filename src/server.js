import express from "express";
import http from "http";
import { Server as SocketIoServer } from "socket.io";

import Tictactoe from "./tictactoe.js";

const app = express();
const server = http.createServer(app);
const sockets = new SocketIoServer(server);

app.use(express.static("public"));

let rooms = {};

function joinRoom(name, socket) {
  if (rooms[name]) {
    rooms[name].players.push({ playerId: socket.id });
    socket.room = rooms[name];
    socket.room.game.eventEmitter.on("changeBoardValue", (data) => {
      socket.emit("boardPositionChanged", data);
    });
    socket.leave("lobby");
    socket.join(name);
    socket.emit("joined room", name);
    console.log(`Room players:`);
    console.table(socket.room.players);
  }
}

function leaveRoom(socket) {
  if (socket.room) {
    socket.room.players = socket.room.players.filter((player) => {
      return player.playerId !== socket.id;
    });

    socket.leave(socket.room.name);
    socket.room = undefined;
    socket.join("lobby");
    socket.emit("left room");
  }
}

sockets.on("connection", (socket) => {
  const playerId = socket.id;
  socket.join("lobby");
  console.log(`Player connected on Server with id: ${playerId}`);
  const roomsNames = Object.keys(rooms);
  socket.emit("gameInfo", {
    constants: { pieces: Tictactoe.pieces, states: Tictactoe.states },
    rooms: roomsNames,
  });

  socket.on("play", (data) => {
    if (socket.room) {
      console.log(
        `Player: ${playerId} in room: ${socket.room.name} trying to play in position: ${data.position}`
      );

      socket.room.game.play({ playerId, position: data.position });
    }
  });

  socket.on("reset", () => {
    if (socket.room) {
      socket.room.game.restart();
    }
  });

  socket.on("create room", ({ name }) => {
    if (rooms[name]) {
      return;
    } else {
      console.log("Creating room");
      rooms[name] = {
        name: name,
        game: new Tictactoe(),
        players: [],
      };
      sockets.to("lobby").emit("update rooms", { rooms: Object.keys(rooms) });
      joinRoom(name, socket);
    }
  });

  socket.on("join room", ({ name }) => {
    if (rooms[name].players.length < 2) {
      joinRoom(name, socket);
    }
  });

  socket.on("leave room", () => {
    leaveRoom(socket);
  });
});

server.listen(3000, () => {
  console.log("Server listening on port: 3000");
});
