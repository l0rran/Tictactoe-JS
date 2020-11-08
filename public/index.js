const socket = io();
let Tictactoe;
let Rooms;

const playerTextElement = document.getElementById("js-player-text");

const gameOverMessageContainerElement = document.getElementsByClassName(
  "js-game-over-message-container"
)[0];
const gameOverMessageElement = document.getElementById("js-game-over-message");

const boardElements = document.getElementsByClassName("js-btn-board");

const playSingleBtn = document.getElementById("js-play-single");
const playMultiBtn = document.getElementById("js-play-multi");

const createRoomContainerElement = document.getElementById(
  "js-create-room-container"
);
const createRoomNameInput = document.getElementById(
  "js-create-room-name-input"
);
const createRoomSubmitBtn = document.getElementById("js-create-room-submit");
const returnMenuBtn = document.getElementById("js-return-menu");


const menuScreen = document.getElementById("js-menu");
const lobbyScreen = document.getElementById("js-lobby");
const gameScreen = document.getElementById("js-game");

const lobbyRoomsListElement = document.getElementById("js-lobby-rooms-list");
const lobbyRoomsEmptyTextElement = document.getElementById(
  "js-lobby-rooms-empty-text"
);
lobbyRoomsEmptyTextElement.classList.add("hidden");

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
  elementToChange.classList.remove("x");
  elementToChange.classList.remove("o");
  elementToChange.classList.remove("win");
  elementToChange.classList.remove("lost");
  elementToChange.text = "";
}

socket.on("connect", () => {
  console.log(`Connection established on server with id: ${socket.id}`);
  menuScreen.classList.remove("hidden");
  lobbyScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
});

socket.on("gameInfo", (gameInfo) => {
  Tictactoe = gameInfo.constants;
  Rooms = gameInfo.rooms;
});

socket.on("turn changed", ({ turnPlayer }) => {
  if (turnPlayer === "player") {
    playerTextElement.textContent = "Sua vez";
  } else {
    playerTextElement.textContent = "Vez do oponente";
  }
});

socket.on("board value changed", ({ position, value }) => {
  const acceptedValues = {
    player: ({ elementToChange }) => {
      elementToChange.classList.add("x");
    },
    opponent: ({ elementToChange }) => {
      elementToChange.classList.add("o");
    },
    empty: ({ elementToChange }) => {
      elementToChange.setAttribute("active", "");
      clearElement(elementToChange);
    },
  };
  const handleValues = acceptedValues[value];
  handleValues({
    elementToChange: Array.from(boardElements).find(
      (element) => element.dataset.pos == position
    ),
  });
});

socket.on("game state changed", (data) => {
  const acceptedStates = {
    over: ({ winner, winPositions }) => {
      let message = "";
      if (winner) {
        const win = winner === "player";
        if (win) {
          message = "Você ganhou!";
        } else {
          message = "Você perdeu!";
        }
        Array.from(boardElements).forEach((element) => {
          const winPos = winPositions.find((pos) => pos == element.dataset.pos);
          if (winPos !== undefined) {
            element.classList.add(win ? "win" : "lost");
          } else {
            clearElement(element);
          }
          element.removeAttribute("active");
        });
      } else {
        message = "Deu velha!";
      }
      gameOverMessageContainerElement.setAttribute("active", "");
      gameOverMessageElement.textContent = message;
    },
    playing: () => {
      gameOverMessageContainerElement.removeAttribute("active");
    },
  };

  const handleStates = acceptedStates[data.state];
  handleStates(data);
});

socket.on("update rooms", ({ rooms }) => {
  Rooms = rooms;
  while (lobbyRoomsListElement.firstChild)
    lobbyRoomsListElement.removeChild(lobbyRoomsListElement.lastChild);
  if (rooms && rooms.length === 0) {
    console.log("Salas vazias");
    const emptyTextElement = lobbyRoomsEmptyTextElement.cloneNode(true);
    emptyTextElement.classList.remove("hidden");
    lobbyRoomsListElement.appendChild(emptyTextElement);
  }
  rooms.forEach((room) => {
    const roomLi = document.createElement("li");
    const roomA = document.createElement("a");
    roomA.href = "#";
    roomA.addEventListener("click", (e) => enterRoom(room));
    roomA.classList.add("btn-list", "active");
    const roomName = document.createElement("span");
    roomName.textContent = room.name;
    const roomPlayers = document.createElement("span");
    roomPlayers.textContent = `Players: ${room.playersAmount}/2`;

    roomA.appendChild(roomName);
    roomA.appendChild(roomPlayers);
    roomLi.appendChild(roomA);
    lobbyRoomsListElement.appendChild(roomLi);
  });
});

function enterRoom({ name }) {
  socket.emit("join", { type: "room", data: { name } });
}

socket.on("joined room", ({ name }) => {
  console.log(name);
  menuScreen.classList.add("hidden")
  gameScreen.classList.remove("hidden")
  lobbyScreen.classList.add("hidden")
});

socket.on("left room", () => {
  menuScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  lobbyScreen.classList.remove("hidden");
});

socket.on("joined lobby", () => {
  console.log("Joined lobby");
  menuScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  lobbyScreen.classList.remove("hidden");
});

socket.on("left lobby", () => {
  console.log("left lobby");
  menuScreen.classList.remove("hidden");
  gameScreen.classList.add("hidden");
  lobbyScreen.classList.add("hidden");
});

playMultiBtn.addEventListener("click", (e) => {
  socket.emit("join", { type: "lobby" });
});

createRoomSubmitBtn.addEventListener("click", (e) => {
  socket.emit("create room", { name: createRoomNameInput.value });
});

returnMenuBtn.addEventListener("click", (e) => {
  socket.emit("leave", { type: "lobby" });
});
