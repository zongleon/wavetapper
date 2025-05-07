import { Application, Texture, Container, Assets } from "pixi.js";
import { Chuck } from "webchuck";
import OSC from "osc-js";
import * as CONSTS from "../src/consts";
import { createCube, createTileTextures, animateFace, animateJump, setCubeTextures } from "../src/utils";

type Player = {
  id: string;
  pos: number;
  setting: number;
};

// Create a new pixi application
const app = new Application();
await app.init({ background: "#dadada", resizeTo: window });
document.getElementById("pixi-container")!.appendChild(app.canvas);
app.ticker.maxFPS = 30;

// load textures
const baseTexture = await Assets.load("/assets/0.jpg");
const tileset = await Assets.load("/assets/tilesetwhite.png");
tileset.source.scaleMode = "nearest";

// make a grid of 16 cubes
let cubes: Container[] = [];
let baseTextures: Texture[] = [];
let specTextures: Texture[][] = [];
let topTextures: Texture[] = [];
let cubeTimeout: NodeJS.Timeout[] = [];
let cubeHeights: number[] = [];

// add cubes!
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) {
    // make textures for this cube
    const leftTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[i * 4 + j][0][0], i * 4 + j);
    const rightTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[i * 4 + j][0][1], i * 4 + j);
    baseTextures.push(leftTexts.bg);
    specTextures.push([leftTexts.composite, rightTexts.composite]);
    topTextures.push(leftTexts.solid);

    const cubeSize = Math.min(app.canvas.width, app.canvas.height) / 6;
    const spacing_x = cubeSize * 1.3;
    const spacing_y = cubeSize * 1.4;
    const cube = createCube(
      (app.canvas.width - 3.5 * spacing_x) / 2 + j * spacing_x,
      (app.canvas.height - 3.5 * spacing_y) / 2 + i * spacing_y,
      cubeSize / 105,
      baseTexture,
      leftTexts.bg,
    );
    cubes.push(cube);
    cubeHeights.push(cube.y);
    app.stage.addChild(cube);
  }
}

// Load and run Chuck asynchronously
let ck: Chuck;
(async () => {
  let files = [{serverFilename: "../chuck/tapper.ck", virtualFilename: "tapper.ck"}].concat(
    CONSTS.SOUNDFILES.map((file) => {
      return { serverFilename: `../chuck/${file}`, virtualFilename: `/${file}` };
    })
  )
  ck = await Chuck.init(files);
  await ck.runFile("tapper.ck");
  ck.startListeningForEvent("soundEvent", () => {
    ck.getIntArray("poss").then(value => {
      for (let i = 0; i < value.length; i++) {
        if (value[i] == 1) {
          animateFace(cubeTimeout, cubes[i], i, {
            baseTextures: baseTextures,
            specTextures: specTextures,
            baseTexture: baseTexture,
            topTextures: topTextures
          });
        }
      }
    })
  });

  // start connection after Chuck is ready
  initConnection();
})();

function initConnection(): OSC {
  // open ws connection
  const plugin = new OSC.WebsocketClientPlugin({ port: CONSTS.PORT });
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
    updatePlayers(players);
  });

  osc.on("/enabled", (message: OSC.Message) => {
    let enabled = JSON.parse(message.args[0] as string);
    updateSection(enabled);
  });

  osc.on("/player/tap", (message: OSC.Message) => { 
    let player = message.args[0] as number;
    animateJump(cubes[player], cubeHeights[player]);
  });

  osc.on("/setting", (message: OSC.Message) => {
    let player = message.args[0] as number;
    let setting = message.args[1] as number;
    updatePlayer({ id: "", pos: player, setting: setting });
  });

  osc.open();

  return osc;
}

function updateSection(enabled: number[]) {
  const arrEnabled = new Array(16).fill(0);
  for (let i = 0; i < enabled.length; i++) {
    arrEnabled[i] = enabled[i];
  }
  ck.setIntArray("enabled_sounds", arrEnabled);
}

function updatePlayers(players: Player[]) {
  const setting = new Array(16).fill(0);
  players.forEach(player => {
    if (!isNaN(player.pos)) {
      setting[player.pos] = player.setting;
    }
  });

  ck.setIntArray("setting_sounds", setting);
}

function updatePlayer(player: Player) {
  updateCubeDesign(player.pos, player.setting);
  ck.setIntArrayValue("setting_sounds", player.pos, [player.setting]);
}

function updateCubeDesign(pos: number, designIndex: number) {
  // Update textures for the current design index
  const leftTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[pos][designIndex][0], pos);
  const rightTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[pos][designIndex][1], pos);

  specTextures[pos][0] = leftTexts.composite;
  specTextures[pos][1] = rightTexts.composite;
}