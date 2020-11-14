import EventEmitter from "events";

class Tictactoe {
  static pieces = {
    EMPTY: "empty",
  };

  static states = {
    Playing: "playing",
    Over: "over",
    Paused: "paused",
  };

  players = [];

  events = new EventEmitter();

  #board;
  #turnPlayer;

  #previousGameState;
  #gameState;

  constructor(players) {
    this.#board = Array(9).fill(Tictactoe.pieces.EMPTY);
    if (players) {
      this.players = players;
    }
    this.changeGameState(Tictactoe.states.Over);

    this.events.on("player left", () => {
      this.changeGameState(Tictactoe.states.Over);
      this.resetBoard();
    });
  }

  getBoard() {
    return this.#board;
  }

  changeTurn(playerIndex) {
    this.#turnPlayer = this.players[playerIndex];
    this.events.emit("turn changed", {
      turnPlayer: this.players[playerIndex],
    });
    this.verifyWin();
  }

  changeBoardValue(position, value) {
    this.#board[position] = value;
    this.events.emit("board value changed", { position, value });
  }

  changeGameState(data) {
    if (data.state === this.#gameState) return;
    this.#previousGameState = this.#gameState;
    this.#gameState = data.state;
    if (this.#previousGameState) {
      data.previousState = this.#previousGameState;
    }
    this.events.emit("game state changed", data);
  }

  resetBoard() {
    this.#board.forEach((value, index) => {
      this.changeBoardValue(index, Tictactoe.pieces.EMPTY);
    });
  }

  requestStart({ id }) {
    const player = this.players.find((p) => p.id === id);
    if (player) {
      player.requestStart = true;
    }
    if (
      this.#gameState !== Tictactoe.states.Playing &&
      this.players.length === 2 &&
      this.players.every((p) => p.requestStart === true)
    ) {
      this.players.forEach((p) => (p.requestStart = false));
      this.resetBoard();
      this.changeGameState({ state: Tictactoe.states.Playing });
      this.changeTurn(Math.round(Math.random()));
    }
  }

  pause() {
    if (this.#gameState === Tictactoe.states.Playing) {
      this.changeGameState({ state: Tictactoe.states.Paused });
    }
  }

  resume() {
    if (
      this.#gameState === Tictactoe.states.Paused &&
      this.players.length === 2
    ) {
      this.changeGameState({ state: Tictactoe.states.Playing });
    }
  }

  verifyWin() {
    if (this.#gameState !== Tictactoe.states.Playing) return;

    const winPositions = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    let emptyPositions = 0;
    winPositions.forEach((positions) => {
      let value = Tictactoe.pieces.EMPTY;
      let same = 0;
      positions.forEach((position) => {
        if (this.#board[position] === Tictactoe.pieces.EMPTY) {
          emptyPositions++;
        } else if (this.#board[position] !== value) {
          value = this.#board[position];
          same = 1;
        } else {
          same++;
        }
      });
      if (value !== Tictactoe.pieces.EMPTY && same === 3) {
        this.changeGameState({
          state: Tictactoe.states.Over,
          winner: value,
          winPositions: positions,
        });
        return;
      }
    });
    if (emptyPositions === 0) {
      this.changeGameState({ state: Tictactoe.states.Over });
    }
  }
  play({ playerId, position }) {
    if (this.#gameState !== Tictactoe.states.Playing) {
      return;
    }
    if (this.#turnPlayer.id !== playerId) {
      console.log("Not player turn!");
      console.log(`Player turn id: ${this.#turnPlayer.playerId}`);
      console.log(`Player Id: ${playerId}`);
      return;
    }
    position = Number(position);

    if (isNaN(position) || position < 0 || position > 9) {
      console.error("Tictactoe: Invalid position");
      return;
    }
    if (this.hasValue(position)) {
      console.error("Tictactoe: Position already has a value");
      return;
    }
    this.changeBoardValue(position, this.#turnPlayer);
    this.changeTurn(this.#turnPlayer == this.players[0] ? 1 : 0);
    console.table(this.#board);
  }

  hasValue(position) {
    return this.#board[position] !== Tictactoe.pieces.EMPTY;
  }
}

export default Tictactoe;
