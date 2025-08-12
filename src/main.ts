
window.addEventListener('DOMContentLoaded', () => {
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
  const makeRectBtn = document.getElementById('make-rect') as HTMLButtonElement;
  const rectWInput = document.getElementById('rect-w') as HTMLInputElement;
  const rectHInput = document.getElementById('rect-h') as HTMLInputElement;
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
    // Quadrillage tous les 0.5m
    const step = pxPerMeter * 0.5;
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
  // -----------------------------------------------------------------------------
  // Création de rectangle (contour pièce)
  makeRectBtn.addEventListener('click', () => {
    const w = parseFloat(rectWInput.value);
    const h = parseFloat(rectHInput.value);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;
    // Centre du canevas
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const halfW = M(w) / 2;
    const halfH = M(h) / 2;
    room.points = [
      { x: cx - halfW, y: cy - halfH },
      { x: cx + halfW, y: cy - halfH },
      { x: cx + halfW, y: cy + halfH },
      { x: cx - halfW, y: cy + halfH }
    ];
    draw();
  });

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

    // Affichage des cotes (longueur en mètres) sur chaque segment
    ctx.save();
    ctx.font = '14px Arial';
    ctx.fillStyle = '#2563eb';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < room.points.length; i++) {
      const a = room.points[i];
      const b = room.points[(i + 1) % room.points.length];
      // Calcul de la longueur en mètres
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const distM = distPx / pxPerMeter;
      // Position du texte au centre du segment
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      // Décalage du texte perpendiculaire au segment (pour lisibilité)
      const perp = { x: -dy, y: dx };
      const norm = Math.sqrt(perp.x * perp.x + perp.y * perp.y);
      const offset = 18; // pixels
      const ox = perp.x / norm * offset;
      const oy = perp.y / norm * offset;
      ctx.fillText(distM.toFixed(2) + ' m', mx + ox, my + oy);
    }
    ctx.restore();

    // Draw vertices
    for (let i = 0; i < room.points.length; i++) {
      const p = room.points[i];
      if (i === room.selectedPoint) {
        // Point sélectionné : cercle orange plus grand
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5cf6';
        ctx.fill();
      }
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

  // -----------------------------------------------------------------------------
  // Gestion des modes
  //
  // Chacun des trois boutons de mode met à jour la variable globale `mode`
  // et ajuste l'attribut aria-pressed afin de refléter l'état actif dans
  // l'interface. On redessine la scène à chaque changement de mode.

  function updateModeButtons(): void {
    modeEditBtn.setAttribute('aria-pressed', (mode === 'edit').toString());
    modeDrawBtn.setAttribute('aria-pressed', (mode === 'draw').toString());
    modeFurnitureBtn.setAttribute('aria-pressed', (mode === 'furniture').toString());
  }

  modeEditBtn.addEventListener('click', () => {
    mode = 'edit';
    updateModeButtons();
  });

  modeDrawBtn.addEventListener('click', () => {
    mode = 'draw';
    updateModeButtons();
  });

  modeFurnitureBtn.addEventListener('click', () => {
    mode = 'furniture';
    updateModeButtons();
  });

  // -----------------------------------------------------------------------------
  // Ajout et déplacement de points (contour)
  //
  // Lorsqu'on clique sur le canevas en mode «dessiner», on ajoute un nouveau
  // sommet dans `room.points`. En mode «éditer», on sélectionne un sommet
  // existant pour le déplacer. Le déplacement se fait pendant le glisser.

  let draggingPoint = false;

  canvas.tabIndex = 0; // Rendre le canevas focusable
  canvas.addEventListener('pointerdown', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
    if (mode === 'draw') {
      // Maj+clic : ajouter un point à la position
      if (ev.shiftKey) {
        room.points.push({ x, y });
        draw();
        return;
      }
      // Sinon, sélectionne un point proche
      const threshold = 8;
      const idx = room.points.findIndex(p => Math.hypot(p.x - x, p.y - y) < threshold);
      if (idx >= 0) {
        room.selectedPoint = idx;
        draggingPoint = true;
        draw();
        canvas.focus();
      }
    } else if (mode === 'edit') {
      // Chercher un point proche
      const threshold = 8; // pixels
      const idx = room.points.findIndex(p => Math.hypot(p.x - x, p.y - y) < threshold);
      if (idx >= 0) {
        room.selectedPoint = idx;
        draggingPoint = true;
        draw();
        canvas.focus();
      }
    }
  });
  // Supprimer le point sélectionné avec la touche Suppr (Delete ou Backspace)
  canvas.addEventListener('keydown', (ev) => {
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && room.selectedPoint >= 0 && room.points.length > 1) {
      room.points.splice(room.selectedPoint, 1);
      room.selectedPoint = -1;
      draw();
    }
  });

  canvas.addEventListener('pointermove', (ev) => {
    if (mode === 'edit' && draggingPoint && room.selectedPoint >= 0) {
      const rect = canvas.getBoundingClientRect();
      let x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      let y = (ev.clientY - rect.top) * (canvas.height / rect.height);
      // Magnétisme : snap sur X ou Y des autres points si proche
      const SNAP_DIST = 10;
      for (let i = 0; i < room.points.length; i++) {
        if (i === room.selectedPoint) continue;
        const px = room.points[i].x;
        const py = room.points[i].y;
        if (Math.abs(x - px) < SNAP_DIST) x = px;
        if (Math.abs(y - py) < SNAP_DIST) y = py;
      }
      room.points[room.selectedPoint].x = x;
      room.points[room.selectedPoint].y = y;
      draw();
    }
  });

  canvas.addEventListener('pointerup', () => {
    draggingPoint = false;
    room.selectedPoint = -1;
  });

  // -----------------------------------------------------------------------------
  // Gestion des meubles
  //
  // Les boutons de meubles (classe .pill) contiennent une propriété
  // data-furniture au format JSON. En mode "placer meubles", cliquer sur
  // un meuble l'ajoute au centre du canevas.

  const furnitureButtons = document.querySelectorAll<HTMLButtonElement>('.pill');
  furnitureButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const data = btn.getAttribute('data-furniture');
      if (!data) return;
      try {
        const spec = JSON.parse(data);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        furniture.push({ x: centerX, y: centerY, w: spec.w, h: spec.h, type: spec.type, rot: 0 });
        mode = 'furniture';
        updateModeButtons();
        draw();
      } catch (e) {
        console.warn('Invalid furniture spec', e);
      }
    });
  });

  // Lorsque l'utilisateur clique sur le canevas en mode "furniture", on
  // sélectionne le meuble le plus récent et on le déplace à la position du
  // curseur.
  let draggingFurniture = false;
  canvas.addEventListener('pointerdown', (ev) => {
    if (mode !== 'furniture') return;
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
    if (furniture.length > 0) {
      const lastIndex = furniture.length - 1;
      furniture[lastIndex].x = x;
      furniture[lastIndex].y = y;
      draggingFurniture = true;
      draw();
    }
  });

  canvas.addEventListener('pointermove', (ev) => {
    if (mode === 'furniture' && draggingFurniture && furniture.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
      const lastIndex = furniture.length - 1;
      furniture[lastIndex].x = x;
      furniture[lastIndex].y = y;
      draw();
    }
  });

  canvas.addEventListener('pointerup', () => {
    draggingFurniture = false;
  });

  // -----------------------------------------------------------------------------
  // Autres actions

  // Vider complètement la scène
  clearBtn.addEventListener('click', () => {
    room.points = [];
    furniture.length = 0;
    draw();
  });

  // Adapter au canevas (fit) : repositionner les points pour qu'ils
  // occupent tout l'espace disponible.  Ici, on calcule la boîte englobante
  // et on applique un ratio uniforme.
  fitButton.addEventListener('click', () => {
    if (room.points.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of room.points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const width = maxX - minX;
    const height = maxY - minY;
    const scaleX = (canvas.width - 40) / width;
    const scaleY = (canvas.height - 40) / height;
    const scale = Math.min(scaleX, scaleY);
    // Recentre les points
    const offsetX = (canvas.width - width * scale) / 2;
    const offsetY = (canvas.height - height * scale) / 2;
    room.points = room.points.map(p => ({
      x: offsetX + (p.x - minX) * scale,
      y: offsetY + (p.y - minY) * scale,
    }));
    pxPerMeter *= scale; // mettre à jour l'échelle pour les meubles
    draw();
  });

  // -----------------------------------------------------------------------------
  // Fin des ajouts
});
