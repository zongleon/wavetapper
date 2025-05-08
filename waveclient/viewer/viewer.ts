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
    const rightTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[i * 4 + j][1][0], i * 4 + j);
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
  let files = [{serverFilename: "/chuck/tapper.ck", virtualFilename: "tapper.ck"}].concat(
    // files are named TRACK 1-1.wav, TRACK 1-2.wav, TRACK 2-1.wav, TRACK 2-2.wav,
    // for 16 tracks each with 2 options
    // don't include TRACK 14 or TRACK 16
    Array.from({ length: 32 }, (_, i) => ({
      serverFilename: `/chuck/tracks/TRACK ${Math.floor(i / 2) + 1}-${(i % 2) + 1}.wav`,
      virtualFilename: `tracks/TRACK ${Math.floor(i / 2) + 1}-${(i % 2) + 1}.wav`
    })).filter((v, _) => v.virtualFilename.indexOf("14-") == -1 &&
                         v.virtualFilename.indexOf("16-") == -1)
  )
  ck = await Chuck.init(files);
  await ck.runFile("tapper.ck");
  ck.startListeningForEvent("soundEvent", () => {
    ck.getIntArray("poss").then(value => {
      for (let i = 0; i < value.length - 1; i++) {
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
  document.getElementById("start-button")!.addEventListener("click", async () => {
    if (ck.context.state === "suspended") {
      (ck.context as AudioContext).resume();
    }
  });
});

  // start connection after Chuck is ready
  initConnection();
})();

function initConnection(): OSC {
  // open ws connection
  const plugin = new OSC.WebsocketClientPlugin({ host: CONSTS.SERVER_URL, port: CONSTS.PORT, secure: CONSTS.SSL });
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
    console.log(enabled);
    updateSection(enabled);
  });

  osc.on("/player/tap", (message: OSC.Message) => { 
    let player = message.args[0] as number;
    animateJump(cubes[player], cubeHeights[player]);
  });

  osc.on("/setting", (message: OSC.Message) => {
    let player = message.args[0] as number;
    let setting = message.args[1] as number;

    if (player == 15) {
      const leftTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[15][0][setting], 15);
      const rightTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[15][1][setting], 15);

      setCubeTextures(cubes[15], [leftTexts.composite, rightTexts.composite, leftTexts.solid]);
      return;
    }
    updatePlayer({ id: "", pos: player, setting: setting });
  });

  osc.on("/volume", (message: OSC.Message) => {
    let player = message.args[0] as number;
    let volume = message.args[1] as number;

    if (player == 13) {
      updateReverb(Math.abs(volume) / 10);
      return;
    }
    updatePlayerVolume(player, volume);
  });

  osc.on("/pan", (message: OSC.Message) => {
    let player = message.args[0] as number;
    let pan = message.args[1] as number;
    updatePlayerPan(player, pan);
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

function updatePlayerVolume(player: number, volume: number) {
  ck.setFloatArrayValue("gains_sounds", player, volume);
}

function updatePlayerPan(player: number, pan: number) {
  ck.setFloatArrayValue("pans_sounds", player, pan);
}

function updateReverb(reverb: number) {
  ck.setFloat("rev14", reverb);
}

function updateCubeDesign(pos: number, designIndex: number) {
  // Update textures for the current design index
  const leftTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[pos][0][designIndex], pos);
  const rightTexts = createTileTextures(app, tileset, CONSTS.DESIGNS[pos][1][designIndex], pos);

  specTextures[pos][0] = leftTexts.composite;
  specTextures[pos][1] = rightTexts.composite;
}