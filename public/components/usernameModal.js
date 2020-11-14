import { events, validateNameInput } from "../utilities.js";

const userNameModal = document.getElementById("js-username-modal");
const modalPageMask = document.getElementsByClassName("js-modal-page-mask")[0];
const formUsernameElement = document.getElementById("js-form-user-name");
const userNameInput = document.getElementById("js-user-name-input");

export function usernameModalSetVisible(visible) {
  "";
  if (visible) {
    modalPageMask.classList.remove("hidden");
    userNameModal.classList.remove("hidden");
  } else {
    modalPageMask.classList.add("hidden");
    userNameModal.classList.add("hidden");
  }
  events.emit("username modal visibility changed", visible);
}

formUsernameElement.addEventListener("submit", (e) => {
  e.preventDefault();
  if (validateNameInput(userNameInput)) {
    usernameModalSetVisible(false);
    events.emit("username submitted", userNameInput.value);
  }
});

const userNameModalCloseBtn = document.getElementById("js-username-modal-back");

userNameModalCloseBtn.addEventListener("click", (e) => {
  e.preventDefault();
  usernameModalSetVisible(false);
});

export default usernameModalSetVisible;
