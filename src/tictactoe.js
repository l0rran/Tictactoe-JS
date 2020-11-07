import EventEmitter from "events";

class TictactoeEmitter extends EventEmitter {}

class Tictactoe {
  static pieces = {
    EMPTY: "",
    X: "X",
    O: "O",
  };

  static states = {
    Playing: "playing",
    Over: "over",
  };

  players = {
    0: {  id: 0, playerId: undefined },
    1: {  id: 1, playerId: undefined },
  };

  eventEmitter = new TictactoeEmitter();

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
    this.eventEmitter.on("changeTurn", this.verifyWin);
    if (players) {
      this.players = players;
    }
  }

  getBoard() {
    return this.#board;
  }

  changeTurn(playerIndex) {
    this.#turnPlayer = this.players[playerIndex];
    this.eventEmitter.emit("changeTurn", {
      turnPlayer: this.players[playerIndex],
    });
  }

  changeBoardValue(position, value) {
    this.#board[position] = value;
    this.eventEmitter.emit("changeBoardValue", { position, value });
  }

  changeGameState(data) {
    if (data.state === this.#gameState) return;
    this.#gameState = data.state;
    console.log("New gameState:");
    console.table(data);
    this.eventEmitter.emit("changeGameState", { state: data.state });
  }

  restart() {
    this.#board.forEach((value, index) => {
      this.changeBoardValue(index, Tictactoe.pieces.EMPTY);
    });
    this.changeGameState({ state: Tictactoe.states.Playing });
    this.changeTurn(0);
  }
  verifyWin() {
    if (this.gameState !== Tictactoe.states.Playing) return;
    let emptyPositions = 0;
    this.#winPositions.forEach((positions) => {
      let value = Tictactoe.pieces.EMPTY;
      let same = 0;
      positions.forEach((position) => {
        if (this.#board[position] === Tictactoe.pieces.EMPTY) {
          emptyPositions++;
        } else if (board[position] !== value) {
          value = board[position];
          same = 1;
        } else {
          same++;
        }
      });
      if (value !== pieces.EMPTY && same === 3) {
        changeGameState({
          state: Tictactoe.states.Over,
          winner: value,
          winPositions: positions,
        });
        return;
      }
    });
    if (emptyPositions === 0) {
      changeGameState({ state: Tictactoe.states.Over });
    }
  }
  play({ playerId, position }) {
    if (this.#gameState !== Tictactoe.states.Playing) return;
    if (this.#turnPlayer.playerId !== playerId) return;
    position = Number(position);

    if (position < 0 || position > 9) {
      console.error("Tictactoe: Invalid position");
      return;
    }
    if (this.hasValue(position)) {
      console.error("Tictactoe: Position already has a value");
      return;
    }
    this.changeBoardValue(position, this.#turnPlayer);
    this.changeTurn(this.#turnPlayer == this.players[0] ? 1 : 0);
  }

  hasValue(position) {
    return this.#board[position] !== Tictactoe.pieces.EMPTY;
  }
}

export default Tictactoe;

/*
class Observable {
  constructor() {
    this.observers = [];
  }

  subscribe(f) {
    this.observers.push(f);
  }

  unsubscribe(f) {
    this.observers = this.observers.filter((subscriber) => subscriber !== f);
  }

  notify(data) {
    this.observers.forEach((observer) => observer(data));
  }
}

const Tictactoe = (() => {
  const pieces = {
    EMPTY: "",
    X: "X",
    O: "O",
  };

  const states = {
    Playing: "playing",
    Over: "over",
  };

  const onPlayerTurnChange = new Observable();
  const onBoardValueChange = new Observable();
  const onGameStateChange = new Observable();

  const board = Array(9).fill(pieces.EMPTY);
  let turnPlayer = pieces.X;
  let gameState = states.Over;

  function changeTurn(newPlayer) {
    turnPlayer = newPlayer;
    onPlayerTurnChange.notify({
      turnPlayer: turnPlayer,
    });
  }

  function changeBoardValue(position, value) {
    board[position] = value;
    onBoardValueChange.notify({
      position: position,
      value: value,
    });
  }

  function changeGameState(data) {
    if (data.state === gameState) return;
    gameState = data.state;
    onGameStateChange.notify(data);
    console.log("New gameState:");
    console.table(data);
  }

  function reset() {
    board.forEach((value, index) => {
      changeBoardValue(index, pieces.EMPTY);
    });
    changeGameState({ state: states.Playing });
    changeTurn(pieces.X);
  }

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

  function verifyWin() {
    if (gameState !== states.Playing) return;
    let emptyPositions = 0;
    winPositions.forEach((positions) => {
      let value = pieces.EMPTY;
      let same = 0;
      positions.forEach((position) => {
        if (board[position] === pieces.EMPTY) {
          emptyPositions++;
        } else if (board[position] !== value) {
          value = board[position];
          same = 1;
        } else {
          same++;
        }
      });
      if (value !== pieces.EMPTY && same === 3) {
        changeGameState({
          state: states.Over,
          winner: value,
          winPositions: positions,
        });
        return;
      }
    });
    if (emptyPositions === 0) {
      changeGameState({ state: states.Over });
    }
  }

  onPlayerTurnChange.subscribe(verifyWin);

  reset();

  return {
    gameInfo: { constants: { pieces: pieces, states: states } },
    onPlayerTurnChange: onPlayerTurnChange,
    onBoardValueChange: onBoardValueChange,
    onGameStateChange: onGameStateChange,
    play: function (position) {
      if (gameState !== states.Playing) return;

      position = Number(position);

      if (position < 0 || position > 9) {
        console.error("Tictactoe: Invalid position");
        return;
      }
      if (this.hasValue(position)) {
        console.error("Tictactoe: Position already has a value");
        return;
      }
      changeBoardValue(position, turnPlayer);
      changeTurn(turnPlayer == pieces.X ? pieces.O : pieces.X);
    },
    hasValue: function (position) {
      return board[position] !== pieces.EMPTY;
    },
    restart: function () {
      reset();
    },
  };
})();
*/
