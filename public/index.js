const socket = io();
let Tictactoe;
let Rooms;

socket.on("connect", () => {
  console.log(`Connection established on server with id: ${socket.id}`);
});

socket.on("gameInfo", (gameInfo) => {
  Tictactoe = gameInfo.constants;
  Rooms = gameInfo.rooms;
});

function createRoom(name) {
  socket.emit("create room", { name });
}

function joinRoom(name) {
  socket.emit("join room", { name });
}

socket.on("playerTurnChanged", handlePlayerTurnChange);
socket.on("boardPositionChanged", handleBoardPositionChange);
socket.on("gameStateChanged", handleGameStateChange);

socket.on("update rooms", ({ rooms }) => {
  Rooms = rooms;
});

socket.on("joined room", (message) => {
  console.log(message);
});

const playerTextElement = document.getElementById("js-player-text");
const playerText = playerTextElement.textContent;

const gameOverMessageContainerElement = document.getElementsByClassName(
  "js-game-over-message-container"
)[0];
const gameOverMessageElement = document.getElementById("js-game-over-message");

const boardElements = document.getElementsByClassName("js-btn-board");

function onElementClick(e) {
  e.preventDefault();
  const elementPos = e.target.dataset.pos;
  socket.emit("play", { position: elementPos });
}

Array.from(boardElements).forEach((element) => {
  element.addEventListener("click", onElementClick);
});

function reset() {
  socket.emit("reset");
}

function clearElement(elementToChange) {
  Object.values(Tictactoe.pieces).forEach((piece) => {
    if (piece !== Tictactoe.pieces.EMPTY) {
      elementToChange.classList.remove(piece.toLowerCase());
    }
  });
  elementToChange.classList.remove("win");
  elementToChange.text = Tictactoe.pieces.EMPTY;
}

function handleBoardPositionChange({ position, value }) {
  const elementToChange = Array.from(boardElements).find((element) => {
    return element.dataset.pos == position;
  });

  if (value !== Tictactoe.pieces.EMPTY) {
    elementToChange.removeAttribute("active");
    elementToChange.classList.add(value.toLowerCase());
  } else {
    elementToChange.setAttribute("active", "");
    clearElement(elementToChange);
  }

  elementToChange.text = value;
}

function handlePlayerTurnChange({ turnPlayer }) {
  playerTextElement.textContent = `${playerText} ${turnPlayer}`;
}

function handleGameStateChange({ state, winner, winPositions }) {
  if (state == Tictactoe.states.Over) {
    let message = "";
    if (winner !== undefined) {
      message = `${winner} ganhou!`;
      Array.from(boardElements).forEach((element) => {
        const winPos = winPositions.find((pos) => pos == element.dataset.pos);
        if (winPos !== undefined) {
          element.classList.add("win");
        } else {
          clearElement(element);
        }
        element.removeAttribute("active");
      });
    } else {
      message = `Deu velha!`;
    }
    gameOverMessageContainerElement.setAttribute("active", "");
    gameOverMessageElement.textContent = message;
  } else if (state == Tictactoe.states.Playing) {
    gameOverMessageContainerElement.removeAttribute("active");
  }
}
