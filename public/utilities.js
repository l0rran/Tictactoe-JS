import { socket } from "./socket.js";

export class EventEmitter {
  #callbacks = {};

  on(event, cb) {
    if (!this.#callbacks[event]) this.#callbacks[event] = [];
    this.#callbacks[event].push(cb);
  }

  off(event, cb) {
    if (!this.#callbacks[event]) return;
    this.#callbacks[event] = this.#callbacks[event].filter((ecb) => ecb !== cb);
  }

  emit(event, data) {
    let cbs = this.#callbacks[event];
    if (cbs) {
      cbs.forEach((cb) => cb(data));
    }
  }
}

export const events = new EventEmitter();

let gameConstants;
let nameRegex = /[A-Za-z ]{5,20}/;

socket.on("gameInfo", (gameInfo) => {
  gameConstants = gameInfo.constants;
  nameRegex = new RegExp(gameInfo.nameRegexPattern);
});

export function validateNameInput(nameInput) {
  if (nameRegex.test(nameInput.value)) {
    nameInput.classList.remove("invalid");
    nameInput.classList.add("valid");
    return true;
  } else {
    nameInput.classList.add("invalid");
    nameInput.classList.remove("valid");
    return false;
  }
}

export const info = {
  gameConstants,
  nameRegex,
};

export let playerInfo = {
  name: "",
};

const utilities = {
  EventEmitter,
  events,
  info,
  validateNameInput,
};
export default utilities;
