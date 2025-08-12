/**
 * Point and furniture type definitions for better type safety.
 */
interface Point {
  x: number;
  y: number;
}

interface FurnitureItem {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  rot?: number;
}

/**
 * Application state.  Using explicit types here helps TypeScript catch
 * mistakes during development. You can expand these types as the
 * application grows (e.g. adding doors, windows, or collision data).
 */
type Mode = 'draw' | 'edit' | 'furniture';

let mode: Mode = 'edit';
let pxPerMeter = 50;
let showGrid = true;
const room: {
  points: Point[];
  selectedPoint: number;
  draggingPoint: boolean;
  bboxHandle: null | 'corner' | 'edge';
} = {
  points: [],
  selectedPoint: -1,
  draggingPoint: false,
  bboxHandle: null,
};
const furniture: FurnitureItem[] = [];
const hover = { point: -1, edge: -1 };

// Obtain references to DOM elements with proper typing.
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const scaleInput = document.getElementById('scale') as HTMLInputElement;
const fitButton = document.getElementById('fit') as HTMLButtonElement;
const toggleGridBtn = document.getElementById('toggle-grid') as HTMLButtonElement;
const clearBtn = document.getElementById('clear') as HTMLButtonElement;
const modeEditBtn = document.getElementById('mode-edit') as HTMLButtonElement;
const modeDrawBtn = document.getElementById('mode-draw') as HTMLButtonElement;
const modeFurnitureBtn = document.getElementById('mode-furniture') as HTMLButtonElement;

/**
 * Convert a measurement in meters to pixels using the current scale.
 */
function M(m: number): number {
  return m * pxPerMeter;
}

/**
 * Draw the canvas.  This function clears the canvas, draws the grid (if
 * enabled), the room contour and furniture.  It should be called every
 * time the state changes.
 */
function draw(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (showGrid) drawGrid();
  drawRoom();
  drawFurniture();
}

function drawGrid(): void {
  const step = pxPerMeter;
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < canvas.width; x += step) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, canvas.height);
  }
  for (let y = 0; y < canvas.height; y += step) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(canvas.width, y + 0.5);
  }
  ctx.stroke();
}

function drawRoom(): void {
  if (room.points.length === 0) return;
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(room.points[0].x, room.points[0].y);
  for (let i = 1; i < room.points.length; i++) {
    const p = room.points[i];
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.stroke();

  // Draw vertices
  ctx.fillStyle = '#8b5cf6';
  for (const p of room.points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFurniture(): void {
  ctx.fillStyle = '#f59e0b';
  furniture.forEach(item => {
    ctx.fillRect(item.x - item.w * pxPerMeter / 2, item.y - item.h * pxPerMeter / 2, item.w * pxPerMeter, item.h * pxPerMeter);
  });
}

/**
 * Event handlers can be progressively ported from the original script.  For
 * instance, here is how to toggle the grid and update the drawing.
 */
toggleGridBtn.addEventListener('click', () => {
  showGrid = !showGrid;
  draw();
});

// Update scale when the user changes the input value
scaleInput.addEventListener('change', () => {
  const value = parseFloat(scaleInput.value);
  if (!isNaN(value) && value > 0) {
    pxPerMeter = value;
    draw();
  }
});

// Initial draw
draw();

/**
 * TODO:
 *
 * - Implémenter les gestionnaires d'événements pour la création et la
 *   modification du contour (clics, déplacements, insertion de points).
 * - Gérer l'ajout de meubles via les boutons `.pill` en lisant les
 *   attributs `data-furniture` et en ajoutant les objets à la liste
 *   `furniture`.
 * - Implémenter l'export/import JSON et l'adaptation au canevas en
 *   utilisant des fonctions séparées.
 * - Extraire ces fonctions dans des modules séparés si l'application
 *   devient plus complexe. Par exemple, un fichier `room.ts` pour le
 *   contour, `furniture.ts` pour les meubles, et `utils.ts` pour les
 *   fonctions mathématiques.
 */
