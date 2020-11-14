import utilities, { events } from "./utilities.js";
import { socket } from "./socket.js";

socket.on("connect", () => {
  console.log(`Connected on server with ID: ${socket.id}`);
});

Array.from(document.getElementsByClassName("js-input-name-validation")).forEach(
  (element) => {
    element.addEventListener("input", (e) =>
      utilities.validateNameInput(e.target)
    );
  }
);
