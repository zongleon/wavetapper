import { Application, Texture, Container, Sprite, Assets } from "pixi.js";
import gsap from "gsap";
import OSC from "osc-js";

const port = 8910;

// const HEIGHT_SCALE = Math.cos(Math.PI / 6);
const HORIZ_SKEW = Math.PI / 6;
const VERT_ROTATE = Math.PI / 6;

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

// Append the application canvas to the document body
document.getElementById("pixi-container")!.appendChild(app.canvas);
const textures: Texture[] = [];
const baseTexture = await Assets.load("/assets/t.jpg");
textures[0] = await Assets.load("/assets/green.jpg");
textures[1] = await Assets.load("/assets/blue.jpg");

// make a grid of 16 cubes
let cubes: Container[] = [];
let baseHeights: number[] = [];

let me: number | null = null;

// add cubes!
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) {
    const cubeSize = Math.min(app.canvas.width, app.canvas.height) / 6;
    const spacing_x = cubeSize * 1.3;
    const spacing_y = cubeSize * 1.4;
    const cube = createCube(
      (app.canvas.width - 3.5 * spacing_x) / 2 + i * spacing_x,
      (app.canvas.height - 3.5 * spacing_y) / 2 + j * spacing_y,
      baseTexture
    );
    cube.scale.set(cubeSize / 105);
    cubes.push(cube);
    baseHeights.push(cube.y);
    app.stage.addChild(cube);
  }
}

// start connection
const osc = initConnection();

function initConnection(): OSC {
  // open ws connection
  const plugin = new OSC.WebsocketClientPlugin({ port: port });
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

  // hide the header
  header.style.display = "none";
}

function updateCubes(players: Player[]) {
  for (let i = 0; i < cubes.length; i++) {
    let active = players.find((value: Player) => {
      return value.pos == i;
    }) !== undefined;
    // (cubes[i].children[1] as Sprite).texture = active ? textures[i] : baseTexture;
    cubes[i].tint = active ? 0xaaaaaa : 0xffffff;
    if (active) {
      cubes[i].off("pointerdown");
      cubes[i].off("pointerenter");
      cubes[i].off("pointerleave");
    }
  }
}


function createCube(
  x: number,
  y: number,
  texture: Texture,
  tint: number = 0xffffff
) {
  const container = new Container();
  container.x = x;
  container.y = y;

  // Create left face
  const left = new Sprite(texture);
  left.skew.set(HORIZ_SKEW, 0);
  left.rotation = VERT_ROTATE;
  left.anchor.set(0.5);
  left.x = -28;
  left.y = 48;
  left.tint = 0xaaaaaa;

  // Create left face
  const top = new Sprite(texture);
  top.skew.set(HORIZ_SKEW, 0);
  top.rotation = -VERT_ROTATE;
  top.anchor.set(0.5);
  top.x = 0;
  top.y = 0.5;
  top.tint = 0xffffff;

  // Create right face
  const right = new Sprite(texture);
  right.skew.set(-HORIZ_SKEW, 0);
  right.rotation = -VERT_ROTATE;
  right.anchor.set(0.5);
  right.x = 28;
  right.y = 48;
  right.tint = 0xcccccc;

  container.tint = tint;
  container.blendMode = "normal";

  container.eventMode = "static";
  container.on("pointerdown", () => {
    // join as this guy!
    const index = cubes.indexOf(container);
    if (index !== -1) {
      joinAsPlayer(index);
      container.off("pointerenter");
      container.off("pointerleave");
      container.off("pointerdown");
      container.on("pointerdown", () => {
        // jump
        animateJump(container, baseHeights[index]);
      });
    }
  });

  container.on("pointerenter", () => {
    // highlight this cube
    container.scale.set(container.scale.x * 1.2);
  });
  container.on("pointerleave", () => {
    // unhighlight this cube
    container.scale.set(container.scale.x / 1.2);
  });

  container.addChild(left, right, top);
  return container;
}

function animateJump(
  container: Container,
  startHeight: number,
  jumpHeight = 20,
  duration = 0.1
) {
  gsap.to(container, {
    y: startHeight - jumpHeight,
    duration: duration,
    ease: "power1.out",
    onComplete: () => {
      gsap.to(container, {
        y: startHeight,
        duration: duration,
        ease: "bounce.out",
      });
    },
  });
}
