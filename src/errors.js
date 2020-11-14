export class InvalidRoomError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidRoomError";
  }
}

export class RoomNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "RoomNotFoundError";
  }
}

export class InvalidNameError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidNameError";
  }
}

export class PlayerNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "PlayerNotFoundError";
  }
}
