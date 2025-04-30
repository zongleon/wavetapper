import { Application, Texture, Container, Sprite, Assets } from "pixi.js";
import { Chuck } from "webchuck";
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

// Create a new pixi application
const app = new Application();
await app.init({ background: "#dadada", resizeTo: window });

// Append the application canvas to the document body
document.getElementById("pixi-container")!.appendChild(app.canvas);
const textures: Texture[] = [];
const baseTexture = await Assets.load("/assets/0.jpg");
for (let i = 0; i < 16; i++) {
  textures[i] = await Assets.load(`/assets/${i+1}.jpg`);
}

// make a grid of 16 cubes
let cubes: Container[] = [];
let baseHeights: number[] = [];

// add cubes!
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) {
    const cubeSize = Math.min(app.canvas.width, app.canvas.height) / 6;
    const spacing_x = cubeSize * 1.3;
    const spacing_y = cubeSize * 1.4;
    const cube = createCube(
      (app.canvas.width - 3.5 * spacing_x) / 2 + i * spacing_x,
      (app.canvas.height - 3.5 * spacing_y) / 2 + j * spacing_y,
      cubeSize / 105,
      textures[i * 4 + j],
    );
    cubes.push(cube);
    baseHeights.push(cube.y);
    app.stage.addChild(cube);
  }
}

// start chuck
const ck = await Chuck.init([{serverFilename: "../chuck/tapper.ck", virtualFilename: "tapper.ck"}]);
await ck.runFile("tapper.ck");
ck.startListeningForEvent("soundEvent", () => { 
  ck.getIntArray("poss").then(value => {
    for (let i = 0; i < value.length; i++) {
      if (value[i] == 1) {
        animateJump(cubes[i], baseHeights[i]);
      }
    }
  })
})

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
    let players: Player[] = JSON.parse(message.args[0] as string);
    players.forEach(player => {
      player.pos = Number(player.pos);
      player.setting = Number(player.setting);
    });
    console.log(players);
    updateCubes(players);
    updateChuck(players);
  });

  osc.open();

  return osc;
}

function updateCubes(players: Player[]) {
  ck.listenForEventOnce("loopEvent", () => {
    console.log("signal");
    for (let i = 0; i < cubes.length; i++) {
      let active = players.find((value: Player) => {
        return value.pos == i;
      }) !== undefined;
      // if active, delete the old cube and create a new one with textures[i]
      if (active) {
        const cube = createCube(cubes[i].x, cubes[i].y, cubes[i].scale.x, textures[i]);
        app.stage.removeChild(cubes[i]);
        cubes[i] = cube;
        app.stage.addChild(cube);
      }
      // (cubes[i].children[1] as Sprite).texture = active ? textures[i] : baseTexture;
    }
  });
}

function updateChuck(players: Player[]) {
  const enabled = new Array(16).fill(0);
  const setting = new Array(16).fill(0);
  players.forEach(player => {
    console.log(player);
    if (!isNaN(player.pos)) {
      enabled[player.pos] = 1;
      setting[player.pos] = player.setting;
    }
  });

  ck.setIntArray("enabled_sounds", enabled);
  ck.setIntArray("setting_sounds", setting);
  // ck.setIntArrayValue("enabled_sounds", 0, [145]);
  // ck.getIntArrayValue("enabled_sounds", 0).then(value => {console.log(value);});
}

function createCube(
  x: number,
  y: number,
  scale: number,
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
  left.x = -27;
  left.y = 48;
  left.tint = 0xaaaaaa;

  // Create top face
  const top = new Sprite(baseTexture);
  top.skew.set(HORIZ_SKEW, 0);
  top.rotation = -VERT_ROTATE;
  top.anchor.set(0.5);
  top.x = 0;
  top.y = 0.5;
  top.tint = 0xcccccc;

  // // Create right face
  const right = new Sprite(texture);
  right.skew.set(-HORIZ_SKEW, 0);
  right.rotation = -VERT_ROTATE;
  right.anchor.set(0.5);
  right.x = 28;
  right.y = 48;
  right.tint = 0xffffff;

  container.tint = tint;
  container.blendMode = "normal";

  container.eventMode = "static";
  container.on("pointerdown", () => {
    if (ck.context.state === "suspended") {
      (ck.context as AudioContext).resume();
    }
    // animateJump(container, y);
  });

  container.addChild(left, right, top);

  container.scale.set(scale);
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
