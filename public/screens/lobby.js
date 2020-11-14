import { changeScreen } from "../screen.js";
import { events, validateNameInput, playerInfo } from "../utilities.js";
import socket from "../socket.js";

events.on("screen changed", ({ screen }) => {
  if (screen === "lobby") {
    const createRoomForm = document.getElementById("js-create-room-form");

    const createRoomNameInput = document.getElementById(
      "js-create-room-name-input"
    );

    createRoomNameInput.addEventListener("input", (e) => {
      validateNameInput(createRoomNameInput);
    });

    createRoomForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const roomNameInputValid = validateNameInput(createRoomNameInput);
      if (roomNameInputValid) {
        socket.emit("join room", {
          name: createRoomNameInput.value,
          playerName: playerInfo.name,
        });
      }
    });

    const returnMenuBtn = document.getElementById("js-return-menu");

    returnMenuBtn.addEventListener("click", (e) => {
      socket.emit("leave lobby");
    });

    lobbyRoomsListElement = document.getElementById("js-lobby-rooms-list");
    lobbyRoomsEmptyTextElement = document.getElementById(
      "js-lobby-rooms-empty-text"
    );
  }
});

let lobbyRoomsListElement;
let lobbyRoomsEmptyTextElement;

socket.on("update rooms", ({ rooms }) => {
  while (lobbyRoomsListElement.firstChild)
    lobbyRoomsListElement.removeChild(lobbyRoomsListElement.lastChild);
  if (rooms && Object.keys(rooms).length === 0) {
    const emptyTextElement = lobbyRoomsEmptyTextElement.cloneNode(true);
    emptyTextElement.classList.remove("hidden");
    lobbyRoomsListElement.appendChild(emptyTextElement);
  }
  for (let [name, room] of Object.entries(rooms)) {
    const roomLi = document.createElement("li");
    const roomA = document.createElement("a");
    roomA.href = "#";
    roomA.addEventListener("click", (e) => enterRoom(room));
    roomA.classList.add("btn-list", "active");
    const roomName = document.createElement("span");
    roomName.textContent = name;
    const roomPlayers = document.createElement("span");
    roomPlayers.textContent = `Players: ${room.players.length}/2`;

    roomA.appendChild(roomName);
    roomA.appendChild(roomPlayers);
    roomLi.appendChild(roomA);
    lobbyRoomsListElement.appendChild(roomLi);
  }
});

function enterRoom({ name }) {
  socket.emit("join room", {
    name,
    playerName: playerInfo.name,
  });
}

events.on("username modal visibility changed", (visible) => {
  if (visible) {
    changeScreen({ screen: "lobby" });
  }
});

events.on("username submitted", (username) => {
  playerInfo.name = username;
  socket.emit("join lobby");
});

socket.on("joined lobby", () => {
  changeScreen({ screen: "lobby" });
});

socket.on("left lobby", () => {
  changeScreen({ screen: "menu" });
});
