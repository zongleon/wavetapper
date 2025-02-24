import { Application, Texture, Container, Sprite, Assets } from "pixi.js";

const HEIGHT_SCALE = Math.cos(Math.PI / 6);
const HORIZ_SKEW = Math.PI / 6;
const VERT_ROTATE = Math.PI / 6;

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#cccccc", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);
  const texture = await Assets.load('/assets/b.jpg'); // Load your 2D design

  // make a grid of 16 cubes
  let cubes = [];

  for (let i = -2; i < 2; i++) {
    for (let j = -2; j < 2; j++) {
      const cube = createCube(app.canvas.width / 2 + i * 150, app.canvas.height / 2 + j * 150, texture);
      cubes.push(cube);
      app.stage.addChild(cube);
    }
  }
})();

function createCube(x: number, y: number, texture: Texture, ) {
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
  top.tint = 0xcccccc;

  // // Create right face
  const right = new Sprite(texture);
  right.skew.set(-HORIZ_SKEW, 0);
  right.rotation = -VERT_ROTATE;
  right.anchor.set(0.5);
  right.x = 28;
  right.y = 48;
  right.tint = 0x888888;

  container.tint = 0xff0000;
  container.blendMode = "normal";

  container.addChild(left, right, top);
  return container;
}
