import Tictactoe from "./tictactoe.js";
import EventEmitter from "events";
import {
  InvalidRoomError,
  PlayerNotFoundError,
  RoomNotFoundError,
} from "./errors.js";

class RoomManagerEventEmitter extends EventEmitter {}

export class RoomManager {
  rooms = {};

  events = new RoomManagerEventEmitter();

  create({ name }) {
    if (this.rooms[name]) {
      throw new InvalidRoomError("Room already exists");
    }
    this.rooms[name] = {
      name: name,
      game: new Tictactoe(),
      players: [],
    };
    this.events.emit("created", { room: this.rooms[name] });
  }
  delete({ name }) {
    if (!this.rooms[name]) {
      //TODO: Display error message
      throw new InvalidRoomError();
    }
    console.log("Deleting room");
    delete this.rooms[name];
    this.events.emit("deleted", { room: this.rooms[name] });
  }
  join({ name, player }) {
    if (!this.rooms[name]) {
      throw new RoomNotFoundError("Rooms doesn't exist");
    }
    if (this.rooms[name].players.length >= 2) {
      //TODO: Display error message
      throw new InvalidRoomError("Room is full");
    }

    if (this.rooms[name].players.find((p) => p.id === player.id)) {
      throw new InvalidRoomError("Player already is in this room");
    }

    this.rooms[name].players.push(player);
    this.rooms[name].game.players.push(player);
    this.events.emit("player joined", { room: this.rooms[name], player });
  }
  leave({ name, player }) {
    if (!this.rooms[name]) {
      //TODO: Display error message
      throw new InvalidRoomError();
    }
    const playerThatLeft = this.rooms[name].players.find(
      (roomPlayer) => roomPlayer.id === player.id
    );

    if (playerThatLeft === undefined) {
      throw new PlayerNotFoundError(
        `Couldn't find player with id: ${player.id}`
      );
    }
    this.rooms[name].players = this.rooms[name].players.filter(
      (roomPlayer) => roomPlayer.id != player.id
    );
    this.rooms[name].game.players = this.rooms[name].game.players.filter(
      (gamePlayer) => gamePlayer.id != player.id
    );
    this.events.emit("player left", {
      room: this.rooms[name],
      player: playerThatLeft,
    });
    this.rooms[name].game.events.emit("player left", {
      player: playerThatLeft,
    });
    if (Object.keys(this.rooms[name].players).length === 0) {
      this.delete({ name });
    }
  }
  formatRoomPlayerForClient(player) {
    return { ...player, id: undefined };
  }
  formatRoomForClient(room) {
    if (room) {
      const newRoom = { ...room, game: undefined };
      newRoom.players = newRoom.players.map((player) =>
        this.formatRoomPlayerForClient(player)
      );
      return newRoom;
    } else {
      throw new RoomNotFoundError();
    }
  }
  get(room) {
    if (room && room.name) {
      if (!this.rooms[room.name]) {
        //TODO: Display error message
        throw new RoomNotFoundError();
      }
      return this.rooms[room.name];
    } else {
      return this.rooms;
    }
  }
  getFormatted(room) {
    if (room && room.name) {
      if (!this.rooms[room.name]) {
        //TODO: Display error message
        throw new RoomNotFoundError();
      }
      return this.formatRoomForClient(this.rooms[room.name]);
    } else {
      let newRooms = {};
      for (let [key, value] of Object.entries(this.rooms)) {
        newRooms[key] = this.formatRoomForClient(value);
      }
      return newRooms;
    }
  }
}

const createRoomManager = (args) => new RoomManager(args);

export default createRoomManager;
