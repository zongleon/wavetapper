import { Container, Sprite, Texture, Application, Rectangle, RenderTexture, Graphics } from "pixi.js";
import * as CONSTS from "./consts";
import gsap from "gsap";

export function createCube(
    x: number,
    y: number,
    scale: number,
    baseTexture: Texture,
    texture: Texture,
    tint: number = 0xffffff
  ) {
    const container = new Container();
    container.x = x;
    container.y = y;
  
    // Create left face
    const left = new Sprite(texture);
    left.skew.set(CONSTS.HORIZ_SKEW, 0);
    left.rotation = CONSTS.VERT_ROTATE;
    left.anchor.set(0.5);
    left.x = -27;
    left.y = 48;
    left.tint = 0xaaaaaa;
  
    // Create top face
    const top = new Sprite(baseTexture);
    top.skew.set(CONSTS.HORIZ_SKEW, 0);
    top.rotation = -CONSTS.VERT_ROTATE;
    top.anchor.set(0.5);
    top.x = 0;
    top.y = 0.5;
    top.tint = 0xbdbdbd;
  
    // // Create right face
    const right = new Sprite(texture);
    right.skew.set(-CONSTS.HORIZ_SKEW, 0);
    right.rotation = -CONSTS.VERT_ROTATE;
    right.anchor.set(0.5);
    right.x = 28;
    right.y = 48;
    right.tint = 0xffffff;
  
    container.tint = tint;
    container.blendMode = "normal";
  
    container.eventMode = "static";
  
    container.addChild(left, right, top);
  
    container.scale.set(scale);
    
    return container;
}
  
// Set the textures of the cube faces: [left, right, top]
export function setCubeTextures(container: Container, textures: [Texture, Texture, Texture]) {
    // Assumes children order: [left, right, top]
    if (container.children.length < 3) return;
    (container.children[0] as Sprite).texture = textures[0]; // left
    (container.children[1] as Sprite).texture = textures[1]; // right
    (container.children[2] as Sprite).texture = textures[2]; // top

}

// Reset the cube faces to default: left/right use texture, top uses baseTexture
export function resetCubeTextures(container: Container, texture: Texture, baseTexture: Texture) {
    if (container.children.length < 3) return;
    (container.children[0] as Sprite).texture = texture;      // left
    (container.children[1] as Sprite).texture = texture;      // right
    (container.children[2] as Sprite).texture = baseTexture;  // top
}

export function animateFace(
    cubeTimeout: ReturnType<typeof setTimeout>[], 
    container: Container, 
    index: number, 
    textures: {
        baseTextures: Texture[], 
        specTextures: Texture[][], 
        baseTexture: Texture, 
        topTextures: Texture[]
    }, 
    duration = 50
) {
    clearTimeout(cubeTimeout[index]);
    setCubeTextures(container, [
        textures.specTextures[index][0], 
        textures.specTextures[index][1], 
        textures.topTextures[index]
    ]);
    cubeTimeout[index] = setTimeout(() => {
        resetCubeTextures(container, textures.baseTextures[index], textures.baseTexture);
    }, duration);
}

export function animateJump(
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


// handle creating a new texture
export function createTileTextures(app: Application, tileset: Texture, tileIndex: number, colorIndex: number) {
  let cols = [CONSTS.COLORS[colorIndex][0], CONSTS.COLORS[colorIndex][1], CONSTS.COLORS[colorIndex][2]]
  let bgColor = cols[0];
  let designColor = cols[1];
  let solidColor = cols[2];

  const TILE_PX    = 11;
  const OUT_PX     = 64;

  const frame = new Rectangle(tileIndex * TILE_PX, 0, TILE_PX, TILE_PX);
  const maskTex = new Texture({source: tileset.source, frame: frame});

  const bgTex = RenderTexture.create({
    width:  OUT_PX,
    height: OUT_PX,
  });

  const renderTex = RenderTexture.create({
    width:  OUT_PX,
    height: OUT_PX,
  });

  const container = new Container();

  const bg = new Graphics()
    .rect(0, 0, OUT_PX, OUT_PX)
    .fill(bgColor);
  container.addChild(bg);

  app.renderer.render({container: container, target: bgTex});

  const maskSprite = new Sprite({texture: maskTex});
  maskSprite.width  = OUT_PX;
  maskSprite.height = OUT_PX;
  maskSprite.tint = designColor;

  container.addChild(maskSprite);

  app.renderer.render({container: container, target:renderTex});

  // 5) also create a plain solid color texture
  const solidRT = RenderTexture.create({
    width:  OUT_PX,
    height: OUT_PX,
  });
  const solidG = new Graphics()
    .rect(0, 0, OUT_PX, OUT_PX)
    .fill(solidColor);
  
  app.renderer.render({ container: solidG, target: solidRT});

  return {
    bg:        bgTex as Texture,
    composite: renderTex as Texture,
    solid:     solidRT as Texture,
  };
}
