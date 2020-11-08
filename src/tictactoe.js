import EventEmitter from "events";

class TictactoeEmitter extends EventEmitter {}

class Tictactoe {
  static pieces = {
    EMPTY: "empty",
  };

  static states = {
    Playing: "playing",
    Over: "over",
  };

  players = {};

  events = new TictactoeEmitter();

  #board;
  #turnPlayer;
  #gameState;
  #winPositions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  constructor(players) {
    this.#board = Array(9).fill(Tictactoe.pieces.EMPTY);
    this.restart();
    if (players) {
      this.players = players;
    }

    this.events.on("player joined", ({ playerId }) => {
      let addId;
      if (!this.players[0]) {
        addId = 0;
      } else if (!this.players[1]) {
        addId = 1;
      }
      if (addId !== undefined) {
        this.players[addId] = { id: addId, playerId };
      }
    });

    this.events.on("player left", ({ playerId }) => {
      for (let [key, player] of Object.entries(this.players)) {
        if (player.playerId === playerId) {
          delete this.players[key];
        }
      }
    });

    this.changeGameState(Tictactoe.states.Over);
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
    this.#gameState = data.state;
    this.events.emit("game state changed", data);
  }

  restart() {
    if (
      this.#gameState !== Tictactoe.states.Playing &&
      this.players[0] &&
      this.players[1]
    ) {
      this.#board.forEach((value, index) => {
        this.changeBoardValue(index, Tictactoe.pieces.EMPTY);
      });
      this.changeGameState({ state: Tictactoe.states.Playing });
      this.changeTurn(0);
    }
  }

  verifyWin() {
    if (this.#gameState !== Tictactoe.states.Playing) return;

    let emptyPositions = 0;
    this.#winPositions.forEach((positions) => {
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
    if (this.#turnPlayer.playerId !== playerId) {
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
