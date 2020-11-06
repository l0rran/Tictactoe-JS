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
    pieces: pieces,
    states: states,
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
