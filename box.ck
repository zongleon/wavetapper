 // camera
GOrbitCamera cam --> GG.scene();
// cam.pos(@(1, 1, 1));
// select main camera
GG.scene().camera( cam );

GCube cube --> GG.scene();

Texture t1, t2;

Texture.load(me.dir() + "b.jpg") @=> Texture cubeTexture;

FlatMaterial mat;
mat.colorMap(cubeTexture);

cube.material(mat);

// Texture.load(me.dir() + "b.jpg") @=> t1;
// Texture.load(me.dir() + "c1.jpg") @=> t2;

// fun void textureSwapper() {
//   while (true) {
//     cube.colorMap(t1);
//     1::second => now;
//     cube.colorMap(t2);
//     1::second => now;
//   }
// } spork ~ textureSwapper();

while (true) {
    GG.nextFrame() => now;
    GG.dt() * .3 => cube.rotateY;
}
