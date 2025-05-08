import { Application, Texture, Container, Assets } from "pixi.js";
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

// modal creation (name selection)
const nameInput = document.getElementById("name-input") as HTMLInputElement;
const nameButton = document.getElementById("name-submit") as HTMLButtonElement;
const namePickerModal = document.getElementById("name-picker-modal")!;
const playerNameSpan = document.getElementById("name")!;
const header = document.getElementById("header")!;
header.style.display = "none";

let playerName = "";

nameButton.addEventListener("click", async () => {
  // start connection
  // when they submit, try to add the gryoscope
  // IMPORTANT: needs to be done on user interaction
  await addGyroscope();

  // set their name
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

// Create a new pixi application for displaying cubes
const app = new Application();
await app.init({ background: "#dadada", resizeTo: window });

// cube size and spacing
const cubeSize = Math.min(app.canvas.width, app.canvas.height) / 6;
const spacing_x = cubeSize * 1.3;
const spacing_y = cubeSize * 1.4;
const scale = cubeSize / 105;

// append the application canvas to the document body
document.getElementById("pixi-container")!.appendChild(app.canvas);
const baseTexture = await Assets.load("/assets/0.jpg");
const tileset: Texture = await Assets.load("/assets/tilesetwhite.png");
tileset.source.scaleMode = "nearest";

// store cubes (container) and some constants
let cubes: Container[] = [];
let baseHeights: number[] = [];

// info about me
let me: number | null = null;
let myDesignIndex: number = 0;

// store arrows as globals
let leftArrow: HTMLButtonElement | null = null;
let rightArrow: HTMLButtonElement | null = null;

function createArrowButtons() {
  // Remove if already present
  if (leftArrow) leftArrow.remove();
  if (rightArrow) rightArrow.remove();

  // draw those guys!
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

  // player 15 should be able to select on choice, not automatically
  if (me === 15) {
    const selectButton = document.createElement("button");
    selectButton.innerText = "Select";
    selectButton.className = "select-button";
    document.body.appendChild(selectButton);

    selectButton.onclick = () => {
      osc.send(new OSC.Message("/player/setting", me, myDesignIndex));
    };
  }
}

// function to switch designs and tell the server
function switchDesign(dir: number) {
  if (me === null) return;
  const designs = CONSTS.DESIGNS[me][0];
  myDesignIndex = (myDesignIndex + dir + designs.length) % designs.length;

  if (me != 15) {
    osc.send(new OSC.Message("/player/setting", me, myDesignIndex));
  }
  updateMyCubeDesign();
}

// update the self cube design
function updateMyCubeDesign() {
  if (me === null) return;
  // Update textures for the current design index
  const leftTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[me][0][myDesignIndex], me);
  const rightTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[me][1][myDesignIndex], me);

  // Update the cube's textures visually
  const cube = cubes[me];
  // Set left, right, top textures
  if (cube.children.length >= 3) {
    setCubeTextures(cube, [leftTexts.composite, rightTexts.composite, leftTexts.solid]);
  }
}

// add 16 cubes!
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

    // IMPORTANT: make the cube clickable
    addListeners(cube);

    baseHeights.push(cube.y);
    cubes.push(cube);
    app.stage.addChild(cube);
  }
}

const osc = initConnection();

function initConnection(): OSC {
  // open ws connection
  const plugin = new OSC.WebsocketClientPlugin({ host: CONSTS.SERVER_URL, port: CONSTS.PORT, secure: CONSTS.SSL });
  const osc = new OSC({ discardLateMessages: true, plugin: plugin });

  // send a view message so the server will send us who is currently playing
  osc.on("open", () => {
    osc.send(new OSC.Message("/viewing", 1));
  });

  // receive current list of players
  osc.on("/players", (message: OSC.Message) => {
    if (me != null) {
      // we only have to update myself so don't worry bout it
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

// when a cube is selected, tell the server! we're in!
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
  // and show the arrow setting switcher
  updateMyCubeDesign();
  createArrowButtons();

  // hide the header
  header.style.display = "none";
}

// just a helper function to disable cubes when they are selected already
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

// try to store and send gyroscope data!
// NOTE: currently no timeout. maybe should add to not overload the server
// requestPermission happens only on some iPhones
async function addGyroscope() {
  if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    await (DeviceOrientationEvent as any).requestPermission();
  }

  window.addEventListener('deviceorientation', (e) => {
    if (me === null) return;
    const { beta, gamma } = e;

    const mappedBeta = Math.max(-0.2, Math.min(0.2, beta! / 90));
    const mappedGamma = Math.max(-1.0, Math.min(1.0, gamma! / 90));
    
    // tell the server!
    osc.send(new OSC.Message("/player/volume", me, mappedBeta));
    osc.send(new OSC.Message("/player/pan", me, mappedGamma));
  }, false);

}