import { Application, Texture, Container, Sprite, Assets } from "pixi.js";
import OSC from "osc-js";
import { createCube, animateJump, createTileTextures, setCubeTextures } from "../src/utils";
import * as CONSTS from "../src/consts";

type Player = {
  id: string;
  pos: number;
  setting: number;
};


/*
  1. show modal to let a player pick a name
  2. let the player pick a cube (show all cubes)
  3. display only their cube
  4. let them make some decisions
*/

// modal
const nameInput = document.getElementById("name-input") as HTMLInputElement;
const nameButton = document.getElementById("name-submit") as HTMLButtonElement;
const namePickerModal = document.getElementById("name-picker-modal")!;
const playerNameSpan = document.getElementById("name")!;
const header = document.getElementById("header")!;
header.style.display = "none";

let playerName = "";

nameButton.addEventListener("click", () => {
  playerName = nameInput.value.trim();
  if (playerName) {
    // Update the span with the player's name
    playerNameSpan.textContent = playerName;

    // Hide the modal
    namePickerModal.style.display = "none";
    header.style.display = "block";
  } else {
    nameInput.placeholder = "enter a name...";
  }
});

// Create a new pixi application
const app = new Application();
await app.init({ background: "#dadada", resizeTo: window });

const cubeSize = Math.min(app.canvas.width, app.canvas.height) / 6;
const spacing_x = cubeSize * 1.3;
const spacing_y = cubeSize * 1.4;
const scale = cubeSize / 105;

// Append the application canvas to the document body
document.getElementById("pixi-container")!.appendChild(app.canvas);
const baseTexture = await Assets.load("/assets/0.jpg");
const tileset: Texture = await Assets.load("/assets/tilesetwhite.png");
tileset.source.scaleMode = "nearest";

// make a grid of 16 cubes
let cubes: Container[] = [];
let baseHeights: number[] = [];
let myDesignIndex: number = 0;

let me: number | null = null;

// --- Arrow UI elements ---
let leftArrow: HTMLButtonElement | null = null;
let rightArrow: HTMLButtonElement | null = null;

function createArrowButtons() {
  // Remove if already present
  if (leftArrow) leftArrow.remove();
  if (rightArrow) rightArrow.remove();

  leftArrow = document.createElement("button");
  rightArrow = document.createElement("button");
  leftArrow.innerText = "←";
  rightArrow.innerText = "→";
  leftArrow.className = "design-arrow left-arrow";
  rightArrow.className = "design-arrow right-arrow";

  document.body.appendChild(leftArrow);
  document.body.appendChild(rightArrow);

  leftArrow.onclick = () => switchDesign(-1);
  rightArrow.onclick = () => switchDesign(1);
}

function removeArrowButtons() {
  if (leftArrow) leftArrow.remove();
  if (rightArrow) rightArrow.remove();
  leftArrow = null;
  rightArrow = null;
}

function switchDesign(dir: number) {
  if (me === null) return;
  const designs = CONSTS.DESIGNS[me];
  myDesignIndex = (myDesignIndex + dir + designs.length) % designs.length;
  osc.send(new OSC.Message("/player/setting", me, myDesignIndex));
  updateMyCubeDesign();
}

function updateMyCubeDesign() {
  if (me === null) return;
  // Update textures for the current design index
  const leftTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[me][myDesignIndex][0], me);
  const rightTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[me][myDesignIndex][1], me);

  // Update the cube's textures visually
  const cube = cubes[me];
  // Set left, right, top textures
  if (cube.children.length >= 3) {
    setCubeTextures(cube, [leftTexts.composite, rightTexts.composite, leftTexts.solid]);
  }
}

// add cubes!
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) {
    // make textures for this cube
    const leftTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[i * 4 + j][0][0], i * 4 + j);

    const cube = createCube(
      (app.canvas.width - 3.5 * spacing_x) / 2 + j * spacing_x,
      (app.canvas.height - 3.5 * spacing_y) / 2 + i * spacing_y,
      scale,
      baseTexture,
      leftTexts.bg,
    );
    addListeners(cube);
    baseHeights.push(cube.y);
    cubes.push(cube);
    app.stage.addChild(cube);
  }
}

// start connection
const osc = initConnection();

function initConnection(): OSC {
  // open ws connection
  const plugin = new OSC.WebsocketClientPlugin({ port: CONSTS.PORT });
  const osc = new OSC({ discardLateMessages: true, plugin: plugin });

  osc.on("open", () => {
    osc.send(new OSC.Message("/viewing", 1));
  });

  osc.on("/players", (message: OSC.Message) => {
    if (me != null) {
      // we only have to update myself
      return;
    }
    let players: Player[] = JSON.parse(message.args[0] as string);
    players.forEach(player => {
      player.pos = Number(player.pos);
      player.setting = Number(player.setting);
    });
    updateCubes(players);
  });

  osc.open();

  return osc;
}

function joinAsPlayer(index: number) {
  console.log("joining!");
  me = index;
  
  // send the index of the cube to the server
  osc.send(new OSC.Message("/join", playerName, index));

  osc.on(`/ping/${index}`, (_: OSC.Message) => {
    osc.send(new OSC.Message(`/pong/${index}`, 1));
  });

  // remove all other cubes from the stage
  for (let i = 0; i < cubes.length; i++) {
    if (i !== index) {
      app.stage.removeChild(cubes[i]);
    }
  }

  // center and make the cube take up the 1/3 of the screen in the center
  const cube = cubes[index];
  cube.x = app.canvas.width / 2;
  cube.y = app.canvas.height / 3;
  cube.scale.set(Math.max(app.canvas.width, app.canvas.height) / 105 / 3);
  baseHeights[index] = cube.y;

  // Set the cube's textures for the current design index
  updateMyCubeDesign();
  // Show arrow buttons for design switching
  createArrowButtons();

  // hide the header
  header.style.display = "none";
}

function updateCubes(players: Player[]) {
  for (let i = 0; i < cubes.length; i++) {
    let active = players.find((value: Player) => {
      return value.pos == i;
    }) !== undefined;
    if (active) {
      cubes[i].off("pointerdown");
      cubes[i].off("pointerenter");
      cubes[i].off("pointerleave");
      cubes[i].tint = 0xaaaaaa;
    } else {
      addListeners(cubes[i]);
      cubes[i].tint = 0xffffff;
    }
  }
}

function addListeners(cube: Container) {
  cube.on("pointerdown", () => {
    // join as this guy!
    const index = cubes.indexOf(cube);
    if (index !== -1) {
      joinAsPlayer(index);
      cube.off("pointerenter");
      cube.off("pointerleave");
      cube.off("pointerdown");
      cube.on("pointerdown", () => {
        // jump
        animateJump(cube, baseHeights[index]);
        osc.send(new OSC.Message("/player/tap", me));
      });
    }
  });
  cube.on("pointerenter", () => {
    // highlight this cube
    cube.scale.set(scale * 1.2);
  });
  cube.on("pointerleave", () => {
    // unhighlight this cube
    cube.scale.set(scale);
  });
}

// Optionally, remove arrows on window unload
window.addEventListener("beforeunload", removeArrowButtons);