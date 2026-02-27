let thickSlider, thrSlider, showMaskChk;
let deformXSlider, deformYSlider;
let fileInput;

let pg, maskG;
let srcImg = null;

function setup() {
  createCanvas(900, 650);
  pixelDensity(1);

  fileInput = createFileInput(handleFile);
  fileInput.position(60, height - 92);

  thickSlider = createSlider(0, 40, 12, 1);
  thickSlider.position(60, height - 62);
  thickSlider.style("width", "220px");

  thrSlider = createSlider(0, 255, 170, 1);
  thrSlider.position(320, height - 62);
  thrSlider.style("width", "260px");

  deformXSlider = createSlider(0.2, 3.0, 1.0, 0.01);
  deformXSlider.position(60, height - 34);
  deformXSlider.style("width", "260px");

  deformYSlider = createSlider(0.2, 3.0, 1.0, 0.01);
  deformYSlider.position(340, height - 34);
  deformYSlider.style("width", "260px");

  showMaskChk = createCheckbox("ver máscara", false);
  showMaskChk.position(620, height - 48);

  pg = createGraphics(width, height);
  pg.pixelDensity(1);

  maskG = createGraphics(width, height);
  maskG.pixelDensity(1);
}

function draw() {
  background(230);

  const thick = thickSlider.value();
  const thr = thrSlider.value();
  const sx = deformXSlider.value();
  const sy = deformYSlider.value();

  pg.clear();
  maskG.clear();

  if (!srcImg) {
    noStroke();
    fill(30);
    textSize(18);
    textAlign(CENTER, CENTER);
    text("Sube un JPG/PNG abajo para engrosar y deformar.", width/2, height/2 - 40);
    drawLabels(thick, thr, sx, sy);
    return;
  }

    const marginBottom = 110; 
  const targetW = width;
  const targetH = height - marginBottom;

  const base = min(targetW / (srcImg.width * sx), targetH / (srcImg.height * sy));

  const cx = width / 2;
  const cy = (targetH) / 2;

  pg.push();
  pg.translate(cx, cy);
  pg.scale(base * sx, base * sy);
  pg.imageMode(CENTER);
  pg.image(srcImg, 0, 0);
  pg.pop();

  const img = pg.get();
  img.loadPixels();

  const outMask = createImage(img.width, img.height);
  outMask.loadPixels();

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = 4 * (x + y * img.width);
      const r = img.pixels[i + 0];
      const g = img.pixels[i + 1];
      const b = img.pixels[i + 2];
      const a = img.pixels[i + 3];

      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      const solid = (a < 255) ? (a > 10) : (lum < thr);

      if (solid) {
        outMask.pixels[i + 0] = 0;
        outMask.pixels[i + 1] = 0;
        outMask.pixels[i + 2] = 0;
        outMask.pixels[i + 3] = 255;
      } else {
        outMask.pixels[i + 3] = 0;
      }
    }
  }

  outMask.updatePixels();
  maskG.image(outMask, 0, 0);


  const barrier = dilateAlpha(maskG, thick);


  image(barrier, 0, 0);

  if (showMaskChk.checked()) {
    image(maskG, 0, 0); 
  } else {
    image(pg, 0, 0);    
  }

  drawLabels(thick, thr, sx, sy);
}

function drawLabels(thick, thr, sx, sy) {
  noStroke();
  fill(30);
  textAlign(LEFT, CENTER);
  textSize(14);

  text("barrera: " + thick, 60, height - 78);
  text("umbral (JPG): " + thr, 320, height - 78);

  text("deform X: " + nf(sx, 1, 2), 60, height - 48);
  text("deform Y: " + nf(sy, 1, 2), 340, height - 48);
}

function handleFile(file) {
  if (file.type === "image") {
    loadImage(file.data, img => {
      srcImg = img;
    });
  } else {
    srcImg = null;
  }
}


function dilateAlpha(gfx, r) {
  const img = gfx.get();
  img.loadPixels();

  const out = createImage(img.width, img.height);
  out.loadPixels();

  const w = img.width;
  const h = img.height;

  function aAt(x, y) {
    const i = 4 * (x + y * w);
    return img.pixels[i + 3];
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let solid = false;

      if (aAt(x, y) > 0) solid = true;
      else {
        for (let dy = -r; dy <= r && !solid; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;

          for (let dx = -r; dx <= r; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            if (dx*dx + dy*dy > r*r) continue;

            if (aAt(xx, yy) > 0) { solid = true; break; }
          }
        }
      }

      const o = 4 * (x + y * w);
      if (solid) {
        out.pixels[o + 0] = 0;
        out.pixels[o + 1] = 0;
        out.pixels[o + 2] = 0;
        out.pixels[o + 3] = 255;
      } else {
        out.pixels[o + 3] = 0;
      }
    }
  }

  out.updatePixels();
  return out;
}