import socket from "../socket.js";
import { changeScreen } from "../screen.js";
import { events, playerInfo } from "../utilities.js";

events.on("screen changed", ({ screen }) => {
  if (screen === "game") {
    playerTextElement = document.getElementById("js-player-text");
    gameOverMessageContainerElement = document.getElementsByClassName(
      "js-game-over-message-container"
    )[0];
    gameOverMessageElement = document.getElementById("js-game-over-message");

    boardElements = document.getElementsByClassName("js-btn-board");

    Array.from(boardElements).forEach((element) => {
      element.addEventListener("click", onElementClick);
    });

    function onElementClick(e) {
      e.preventDefault();
      const elementPos = e.target.dataset.pos;
      socket.emit("play", { position: elementPos });
    }

    roomInfoPlayersElement = document.getElementById("js-room-info-players");

    logElement = document.getElementById("js-room-info-log");

    gameInfoMessageElement = document.getElementById("js-game-info-message");
    gameInfoButtonElement = document.getElementById("js-game-info-btn");

    gameInfoButtonElement.addEventListener("click", () => {
      socket.emit("start game");
      setGameInfoState({ state: "waiting" });
    });

    const backToLobbyBtn = document.getElementById("js-back-to-lobby-btn");
    backToLobbyBtn.addEventListener("click", () => socket.emit("leave room"));
  }
});

let boardElements;
let gameOverMessageContainerElement;
let gameOverMessageElement;

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
      gameOverMessageContainerElement.removeAttribute("active");
      gameOverMessageElement.textContent = message;
      setGameInfoState({ state: "replay" });
    },
    playing: () => {
      gameOverMessageContainerElement.removeAttribute("active");
      setGameInfoState({ state: "playing" });
    },
  };

  const handleStates = acceptedStates[data.state];
  if (handleStates) {
    handleStates(data);
  }
});

let playerTextElement;

socket.on("turn changed", ({ player, turnPlayer }) => {
  if (turnPlayer === "player") {
    playerTextElement.textContent = "Sua vez";
  } else {
    playerTextElement.textContent = "Vez do oponente";
  }
  const playersDivs = Array.from(document.getElementsByClassName("player"));
  playersDivs.forEach((playerDiv) => playerDiv.classList.remove("turn"));
  const currentPlayerDiv = document.getElementById(
    `js-player-infos-${player.name}`
  );
  if (currentPlayerDiv) {
    currentPlayerDiv.classList.add("turn");
  }
});

function clearElement(elementToChange) {
  elementToChange.classList.remove("x");
  elementToChange.classList.remove("o");
  elementToChange.classList.remove("win");
  elementToChange.classList.remove("lost");
}

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

let roomInfoPlayersElement;
function updatePlayers(players) {
  while (roomInfoPlayersElement.firstChild)
    roomInfoPlayersElement.removeChild(roomInfoPlayersElement.lastChild);
  if (players && players instanceof Array) {
    players.forEach((player) => {
      const playerDiv = document.createElement("div");
      playerDiv.classList.add("player");
      playerDiv.id = `js-player-infos-${player.name}`;

      const playerNameDiv = document.createElement("div");
      playerNameDiv.classList.add("name");
      playerNameDiv.textContent = player.name;

      const playerStatusDiv = document.createElement("div");
      playerStatusDiv.classList.add("status");
      playerStatusDiv.textContent =
        player.name === playerInfo.name ? "Você" : "Oponente";

      playerDiv.appendChild(playerNameDiv);
      playerDiv.appendChild(playerStatusDiv);
      roomInfoPlayersElement.appendChild(playerDiv);
    });
    if (players.length === 2) {
      setGameInfoState({ state: "play" });
    } else {
      setGameInfoState({ state: "waiting" });
    }
  }
}

let gameInfoMessageElement;
let gameInfoButtonElement;

function setGameInfoState({ state }) {
  const handleState = {
    waiting: function () {
      gameInfoMessageElement.classList.add("hidden");
      gameInfoButtonElement.classList.remove("hidden");
      gameInfoButtonElement.setAttribute("disabled", "true");
      gameInfoButtonElement.textContent = "Aguardando oponente...";
    },
    play: function () {
      gameInfoMessageElement.classList.add("hidden");
      gameInfoButtonElement.classList.remove("hidden");
      gameInfoButtonElement.removeAttribute("disabled");
      gameInfoButtonElement.textContent = "Jogar";
    },
    playing: function () {
      gameInfoMessageElement.classList.add("hidden");
      gameInfoButtonElement.classList.add("hidden");
    },
    replay: function () {
      gameInfoMessageElement.classList.add("hidden");
      gameInfoButtonElement.classList.remove("hidden");
      gameInfoButtonElement.removeAttribute("disabled");
      gameInfoButtonElement.textContent = "Jogar novamente";
    },
  };
  handleState[state]();
}

let logElement;

function sendLog({ message, className }) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  if (className) {
    messageElement.classList.add(...className.split(" "));
  }
  messageElement.innerHTML = message;
  logElement.appendChild(messageElement);
}

socket.on("joined room", (room) => {
  changeScreen({ screen: "game" });
  sendLog({
    message: "<strong>Você</strong> entrou na sala",
    className: "joined",
  });
  setGameInfoState({ state: "waiting" });
  updatePlayers(room.players);
});

socket.on("left room", () => {
  changeScreen({ screen: "menu" });
});

socket.on("player joined", ({ room, player }) => {
  sendLog({
    message: `<strong>${player.name}</strong> entrou na sala`,
    className: "joined",
  });
  updatePlayers(room.players);
});

socket.on("player left", ({ room, player }) => {
  sendLog({
    message: `<strong>${player.name}</strong> saiu da sala`,
    className: "left",
  });
  updatePlayers(room.players);
});
