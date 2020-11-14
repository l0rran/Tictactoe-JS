import { events } from "../utilities.js";
import { changeScreen } from "../screen.js";
import { usernameModalSetVisible } from "../components/usernameModal.js";

events.on("screen changed", ({ screen }) => {
  if (screen === "menu") {
    const playMultiBtn = document.getElementById("js-play-multi");

    playMultiBtn.addEventListener("click", (e) => {
      usernameModalSetVisible(true);
    });
  }
});

events.on("username modal visibility changed", (visible) => {
  if (!visible) {
    changeScreen({ screen: "menu" });
  }
});
