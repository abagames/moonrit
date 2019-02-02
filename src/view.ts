export const size = 512;
export const bloomScale = 8;
export let canvas: HTMLCanvasElement;
export let context: CanvasRenderingContext2D;
export let bloomContext: CanvasRenderingContext2D;

let updateFunc: Function;

export function init(_initFunc: Function, _updateFunc: Function) {
  updateFunc = _updateFunc;
  if (context != null) {
    _initFunc();
    return;
  }
  canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  context = canvas.getContext("2d");
  const bloomCanvas = document.createElement("canvas");
  bloomCanvas.width = bloomCanvas.height = size / bloomScale;
  bloomCanvas.style.opacity = "0.7";
  bloomContext = bloomCanvas.getContext("2d");
  document.body.appendChild(canvas);
  document.body.appendChild(bloomCanvas);
  _initFunc();
  update();
}

const bloomRatio = 1.5;

export function fillRect(
  x: number,
  y: number,
  width: number,
  height: number,
  color: { r: number; g: number; b: number },
  brightness: number
) {
  const b = Math.sqrt(brightness);
  context.fillStyle = `rgb(${color.r * b},${color.g * b},${color.b * b})`;
  context.fillRect(x - width / 2, y - width / 2, width, height);
  bloomContext.fillStyle = `rgb(${color.r * brightness * bloomRatio},${color.g *
    brightness *
    bloomRatio},${color.b * brightness * bloomRatio})`;
  const w = width * brightness;
  const h = height * brightness;
  bloomContext.fillRect(
    (x - w) / bloomScale,
    (y - h) / bloomScale,
    (w * 2) / bloomScale,
    (h * 2) / bloomScale
  );
}

function clear() {
  context.fillStyle = "black";
  context.fillRect(0, 0, size, size);
  bloomContext.clearRect(0, 0, size / bloomScale, size / bloomScale);
}

function update() {
  requestAnimationFrame(update);
  clear();
  updateFunc();
}
