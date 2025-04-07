import { Application, Texture, Container, Sprite, Assets } from "pixi.js";
import { Chuck } from "webchuck";
import gsap from "gsap";

const HEIGHT_SCALE = Math.cos(Math.PI / 6);
const HORIZ_SKEW = Math.PI / 6;
const VERT_ROTATE = Math.PI / 6;

(async () => {
  // start chuck
  const ck = await Chuck.init([]);

  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#dadada", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);
  const texture = await Assets.load("/assets/t.jpg");
  const texture2 = await Assets.load("/assets/green.jpg");
  const texture3 = await Assets.load("/assets/blue.jpg");

  // make a grid of 16 cubes
  let cubes = [];

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const cube = createCube(
        app.canvas.width / 3 + i * 150,
        150 + j * 150,
        texture
      );
      cubes.push(cube);
      app.stage.addChild(cube);

      if (i % 2 == 0 && j % 2 == 1) {
        (cubes[cubes.length - 1].children[1] as Sprite).texture = texture2;
      } else {
        (cubes[cubes.length - 1].children[1] as Sprite).texture = texture3;
      }
    }
  }
})();

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

  // // Create right face
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
    animateJump(container, y);
  });

  container.addChild(left, right, top);
  return container;
}

function animateJump(
  container: Container,
  startHeight: number,
  jumpHeight = 20,
  duration = 0.2
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
