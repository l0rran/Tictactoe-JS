import express from "express";
import http from "http";
import { Server as SocketIoServer } from "socket.io";

import Tictactoe from "./tictactoe.js";

const app = express();
const server = http.createServer(app);
const sockets = new SocketIoServer(server);

app.use(express.static("public"));

let rooms = {};

function formatRoomsForPlayers() {
  let roomsForPlayers = [];
  for (let [key, value] of Object.entries(rooms)) {
    roomsForPlayers = [
      ...roomsForPlayers,
      { name: key, playersAmount: value.players.length },
    ];
  }
  return roomsForPlayers;
}

function updateRooms(data) {
  if (data && data.socket) {
    data.socket.emit("update rooms", { rooms: formatRoomsForPlayers() });
  } else {
    sockets
      .to("lobby")
      .emit("update rooms", { rooms: formatRoomsForPlayers() });
  }
}

const acceptedJoins = {
  lobby: ({ socket }) => {
    if (socket.room) {
      leave({ type: "room", data: { socket } });
    }
    if (!socket.inLobby) {
      socket.join("lobby");
      socket.emit("joined lobby");
      updateRooms({ socket, rooms });
      socket.inLobby = true;
    }
  },
  room: ({ name, socket }) => {
    if (!rooms[name] || rooms[name].players.length >= 2) {
      //TODO: Display error message
      return;
    }
    rooms[name].players.push({ playerId: socket.id });
    socket.room = rooms[name];
    socket.room.game.events.on("board value changed", (data) => {
      let newData = { ...data };
      if (newData.value.playerId) {
        if (newData.value.playerId === socket.id) {
          newData.value = "player";
        } else {
          newData.value = "opponent";
        }
      }

      socket.emit("board value changed", newData);
    });

    socket.room.game.events.on("game state changed", (data) => {
      let newData = { ...data };
      if (newData.winner) {
        if (newData.winner.playerId === socket.id) {
          newData.winner = "player";
        } else {
          newData.winner = "opponent";
        }
      }

      socket.emit("game state changed", newData);
    });

    socket.room.game.events.on("turn changed", ({ turnPlayer }) => {
      if (turnPlayer) {
        socket.emit("turn changed", {
          turnPlayer: turnPlayer.playerId === socket.id ? "player" : "opponent",
        });
      }
    });

    leave({ type: "lobby", data: { socket } });
    socket.join(name);
    socket.emit("joined room", { name });
    socket.room.game.events.emit("player joined", { playerId: socket.id });
    updateRooms(rooms);
    console.log(`Room players:`);
    console.table(socket.room.players);
  },
};

const join = ({ type, data }) => {
  if (type) {
    acceptedJoins[type](data);
  }
};

const acceptedLeaves = {
  room: ({ socket }) => {
    if (socket.room) {
      socket.room.players = socket.room.players.filter((player) => {
        return player.playerId !== socket.id;
      });
      if (Object.keys(socket.room.players).length === 0) {
        delete rooms[socket.room.name];
        updateRooms({ rooms });
      }
      socket.room.game.events.emit("player left", { playerId: socket.id });
      socket.leave(socket.room.name);
      delete socket.room;
      socket.emit("left room");
      join({ type: "lobby", data: { socket } });
      updateRooms();
    }
  },
  lobby: ({ socket }) => {
    if (socket.inLobby) {
      socket.leave("lobby");
      socket.emit("left lobby");
      socket.inLobby = false;
    }
  },
};

const leave = ({ type, data }) => {
  if (type) {
    acceptedLeaves[type](data);
  }
};

sockets.on("connection", (socket) => {
  const playerId = socket.id;
  console.log(`Player connected on Server with id: ${playerId}`);
  socket.emit("gameInfo", {
    constants: { pieces: Tictactoe.pieces, states: Tictactoe.states },
  });

  socket.on("disconnect", () => {
    leave({ type: "room", data: { socket } });
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
      updateRooms({ rooms });
      join({ type: "room", data: { name, socket } });
    }
  });

  socket.on("join", ({ type, data }) => {
    join({ type, data: { socket, ...data } });
  });

  socket.on("leave", ({ type, data }) => {
    leave({ type, data: { socket, ...data } });
  });
});

server.listen(3000, () => {
  console.log("Server listening on port: 3000");
});
