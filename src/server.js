import express from "express";
import http from "http";
import { Server as SocketIoServer } from "socket.io";

import Tictactoe from "./tictactoe.js";
import RoomManager from "./roomManager.js";
import { RoomNotFoundError } from "./errors.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const server = http.createServer(app);
const sockets = new SocketIoServer(server);
const port = process.env.PORT || 3000;

app.use(express.static("public"));

const nameRegexPattern = "^(?=[a-zA-Z0-9._]{5,20}$)(?!.*[_.]{2})[^_.].*[^_.]$";
const nameRegex = new RegExp(nameRegexPattern);

const roomManager = RoomManager();

function updateRooms(data) {
  if (data && data.socket) {
    data.socket.emit("update rooms", { rooms: roomManager.getFormatted() });
  } else {
    sockets
      .to("lobby")
      .emit("update rooms", { rooms: roomManager.getFormatted() });
  }
}

roomManager.events.on("created", ({ room }) => {
  updateRooms();
});

roomManager.events.on("deleted", ({ room }) => {
  updateRooms();
});

roomManager.events.on("player joined", ({ room, player }) => {
  updateRooms();
  sockets.to(room.name).emit("player joined", {
    room: roomManager.formatRoomForClient(room),
    player: roomManager.formatRoomPlayerForClient(player),
  });
});

roomManager.events.on("player left", ({ room, player }) => {
  updateRooms();
  sockets.to(room.name).emit("player left", {
    room: roomManager.formatRoomForClient(room),
    player: roomManager.formatRoomPlayerForClient(player),
  });
});

sockets.on("connection", (socket) => {
  const playerId = socket.id;
  console.log(`Player connected on Server with id: ${playerId}`);

  socket.emit("gameInfo", {
    constants: { pieces: Tictactoe.pieces, states: Tictactoe.states },
    nameRegexPattern,
  });

  socket.on("disconnect", () => {
    socket.leaveRoom();
    socket.leaveLobby();
  });

  socket.getPlayer = function (player) {
    if (player.id === this.id) {
      return "player";
    }
    return "opponent";
  };

  socket.joinLobby = function () {
    if (this.room) {
      this.leaveRoom();
    }
    if (!this.inLobby) {
      this.join("lobby");
      this.emit("joined lobby");
      this.inLobby = true;
      updateRooms({ socket: this });
    }
  };

  socket.leaveLobby = function () {
    if (this.inLobby) {
      this.leave("lobby");
      this.emit("left lobby");
      this.inLobby = false;
    }
  };

  socket.joinRoom = function ({ name, playerName }) {
    console.log(`Player: ${playerName} trying to join room: ${name}`);
    if (!name || !nameRegex.test(name)) {
      //TODO: Display invalid room name error
      return;
    }

    if (!playerName || !nameRegex.test(playerName)) {
      //TODO: Display invalid player name error
      return;
    }
    try {
      roomManager.join({ name, player: { id: this.id, name: playerName } });
      this.room = roomManager.get({ name });
    } catch (e) {
      if (e instanceof RoomNotFoundError) {
        roomManager.create({ name });
        socket.joinRoom({ name, playerName });
      } else {
        console.log(name);
        console.log(e);
        return;
      }
    }

    this.leaveLobby();

    this.room.game.events.on("board value changed", (data) => {
      let newData = { ...data };
      if (newData.value && newData.value.id) {
        newData.value = this.getPlayer(newData.value);
      }
      this.emit("board value changed", newData);
    });

    this.room.game.events.on("game state changed", (data) => {
      let newData = { ...data };
      if (newData.winner) {
        newData.winner = socket.getPlayer(newData.winner);
      }
      this.emit("game state changed", newData);
    });

    this.room.game.events.on("turn changed", ({ turnPlayer }) => {
      if (turnPlayer) {
        this.emit("turn changed", {
          turnPlayer: this.getPlayer(turnPlayer),
          player: roomManager.formatRoomPlayerForClient(turnPlayer),
        });
      }
    });

    this.join(name);
    this.emit("joined room", roomManager.formatRoomForClient(this.room));
  };

  socket.leaveRoom = function () {
    if (this.room) {
      try {
        roomManager.leave({
          name: this.room.name,
          player: { id: this.id },
        });
      } catch (e) {
        console.log(e);
        return;
      }
      this.leave(this.room.name);
      delete this.room;
      this.emit("left room");
      this.joinLobby();
    }
  };

  socket.on("start game", () => {
    socket.room.game.requestStart({ id: socket.id });
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

  socket.on("join lobby", () => {
    socket.joinLobby();
  });

  socket.on("leave lobby", () => {
    socket.leaveLobby();
  });

  socket.on("join room", (data) => {
    socket.joinRoom({ ...data });
  });

  socket.on("leave room", () => {
    socket.leaveRoom();
  });
});

server.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
