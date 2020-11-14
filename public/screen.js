import socket from "./socket.js";
import { events } from "./utilities.js";

export let config = {
  templatesFolder: "./screens/templates/",
  screens: ["menu", "lobby", "game"],
};

async function loadTemplateAsync(templateName) {
  const templatePage = await fetch(
    `${config.templatesFolder}${templateName}.html`
  );
  if (templatePage.status !== 200) {
    throw new ReferenceError("Template " + templatePage.statusText);
  }
  const pageText = await templatePage.text();

  const dummy = document.createElement("div");
  dummy.innerHTML = pageText;

  const template = dummy.getElementsByTagName("template")[0];
  return template;
}

let screensTemplates = {};

(async function loadScreens() {
  screensTemplates = {};
  const dummy = [...config.screens];
  await Promise.all(
    dummy.map(async (name) => {
      const template = await loadTemplateAsync(name);
      document.getElementsByTagName("body")[0].appendChild(template);
      screensTemplates[name] = template;
    })
  );
  events.emit("screens loaded");
})();

const mainDiv = document.getElementById("js-main-div");

export async function changeScreen({ screen }) {
  const screenTemplate = document.importNode(
    screensTemplates[screen].content.children[0],
    true
  );
  if (!screenTemplate) {
    throw new ReferenceError("Screen not found: " + screen);
  }
  while (mainDiv.firstChild) mainDiv.removeChild(mainDiv.lastChild);

  mainDiv.appendChild(screenTemplate);
  events.emit("screen changed", { screen });
}

events.on("screens loaded", () => {
  changeScreen({ screen: "menu" });
});

socket.on("connect", () => {
  changeScreen({ screen: "menu" });
});

export default changeScreen;
