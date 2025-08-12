window.addEventListener('DOMContentLoaded', () => {
  /**
   * Point and furniture type definitions for better type safety.
   */
  interface Point {
    x: number;
    y: number;
  }

  // Modèle de meuble : position, dimensions, angle, texte
  interface FurnitureItem {
    x: number;
    y: number;
    w: number;
    h: number;
    type: string; // texte affiché
    rot?: number; // angle en degrés
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
  let selectedFurniture: number = -1;
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

  // Couleurs par type d'objet
  const furnitureColors: Record<string, string> = {
    canape: '#f59e0b',
    table: '#10b981',
    lit: '#6366f1',
    chaise: '#ef4444',
    placard: '#0ea5e9',
    default: '#6b7280'
  };

  // Correction du dessin : applique la rotation à la forme ET au texte
  function drawFurniture(): void {
    furniture.forEach((item, idx) => {
      const color = furnitureColors[item.type] || furnitureColors.default;
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(((item.rot ?? 0) * Math.PI) / 180);
      // Dessine le rectangle
      ctx.fillStyle = color;
      ctx.fillRect(-item.w * pxPerMeter / 2, -item.h * pxPerMeter / 2, item.w * pxPerMeter, item.h * pxPerMeter);
      // Sélection visuelle
      if (idx === selectedFurniture) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.strokeRect(-item.w * pxPerMeter / 2, -item.h * pxPerMeter / 2, item.w * pxPerMeter, item.h * pxPerMeter);
      }
      // Dessine le texte au centre, rotation appliquée
      ctx.font = '13px Arial';
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.type, 0, 0);
      ctx.restore();
    });
    showFurnitureInputs();
  }

  // Ajoute les inputs pour modifier les dimensions du placard sélectionné
  function showPlacardInputs() {
    // Nettoie l'ancien formulaire
    let form = document.getElementById('placard-form');
    if (form) form.remove();
    if (selectedFurniture < 0 || furniture[selectedFurniture].type !== 'placard') return;
    // Crée le formulaire
    form = document.createElement('form');
    form.id = 'placard-form';
    form.style.position = 'absolute';
    form.style.left = (furniture[selectedFurniture].x + 20) + 'px';
    form.style.top = (furniture[selectedFurniture].y - 20) + 'px';
    form.style.background = '#fff';
    form.style.border = '1px solid #e5e7eb';
    form.style.borderRadius = '8px';
    form.style.padding = '8px';
    form.style.zIndex = '100';
    form.innerHTML = `
      <label style="font-size:12px">Largeur (m): <input type="number" step="0.1" min="0.2" value="${furniture[selectedFurniture].w}" id="placard-w" style="width:50px" /></label>
      <label style="font-size:12px;margin-left:8px">Profondeur (m): <input type="number" step="0.1" min="0.2" value="${furniture[selectedFurniture].h}" id="placard-h" style="width:50px" /></label>
      <button type="button" id="placard-delete" style="margin-left:12px;color:#ef4444;background:#fff;border:1px solid #ef4444;border-radius:6px;padding:2px 8px;cursor:pointer">Supprimer</button>
      <button type="button" id="placard-rotate" style="margin-left:12px;color:#2563eb;background:#fff;border:1px solid #2563eb;border-radius:6px;padding:2px 8px;cursor:pointer">Rotation 90°</button>
    `;
    document.body.appendChild(form);
    // Gestion des changements
    form.querySelector('#placard-w')?.addEventListener('change', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      if (!isNaN(val) && val > 0) {
        furniture[selectedFurniture].w = val;
        draw();
      }
    });
    form.querySelector('#placard-h')?.addEventListener('change', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      if (!isNaN(val) && val > 0) {
        furniture[selectedFurniture].h = val;
        draw();
      }
    });
    form.querySelector('#placard-delete')?.addEventListener('click', (e) => {
      furniture.splice(selectedFurniture, 1);
      selectedFurniture = -1;
      cleanupPlacardForm();
      draw();
    });
    form.querySelector('#placard-rotate')?.addEventListener('click', (e) => {
      // Inverse largeur/profondeur et met à jour l'angle
      const obj = furniture[selectedFurniture];
      [obj.w, obj.h] = [obj.h, obj.w];
      obj.rot = ((obj.rot ?? 0) + 90) % 360;
      draw();
    });
  }

  // Nettoyage du formulaire si on change de mode ou sélection
  function cleanupPlacardForm() {
    const form = document.getElementById('placard-form');
    if (form) form.remove();
  }
  modeEditBtn.addEventListener('click', cleanupPlacardForm);
  modeDrawBtn.addEventListener('click', cleanupPlacardForm);
  clearBtn.addEventListener('click', cleanupPlacardForm);

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
  // Les boutons de meubles (classe .pill) contiennent une propriété data-furniture au format JSON.
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
        selectedFurniture = furniture.length - 1;
        mode = 'furniture';
        updateModeButtons();
        draw();
      } catch (e) {
        console.warn('Invalid furniture spec', e);
      }
    });
  });

  // Sélection et déplacement de n'importe quel meuble
  let draggingFurniture = false;
  let dragOffset = { x: 0, y: 0 };
  canvas.addEventListener('pointerdown', (ev) => {
    if (mode !== 'furniture') {
      selectedFurniture = -1;
      cleanupFurnitureForm();
      cleanupPlacardForm();
      draw();
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
    // Cherche si on clique sur un meuble
    let found = false;
    for (let i = furniture.length - 1; i >= 0; i--) {
      const item = furniture[i];
      const left = item.x - item.w * pxPerMeter / 2;
      const right = item.x + item.w * pxPerMeter / 2;
      const top = item.y - item.h * pxPerMeter / 2;
      const bottom = item.y + item.h * pxPerMeter / 2;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        selectedFurniture = i;
        dragOffset.x = x - item.x;
        dragOffset.y = y - item.y;
        draggingFurniture = true;
        found = true;
        draw();
        break;
      }
    }
    if (!found) {
      selectedFurniture = -1;
      cleanupFurnitureForm();
      cleanupPlacardForm();
      draw();
    }
  });

  canvas.addEventListener('pointermove', (ev) => {
    if (mode === 'furniture' && draggingFurniture && selectedFurniture >= 0) {
      const rect = canvas.getBoundingClientRect();
      let x = (ev.clientX - rect.left) * (canvas.width / rect.width);
      let y = (ev.clientY - rect.top) * (canvas.height / rect.height);
      // Magnétisme par rapport au contour de la pièce
      const SNAP_DIST = 15;
      if (room.points.length > 1) {
        for (let i = 0; i < room.points.length; i++) {
          const a = room.points[i];
          const b = room.points[(i + 1) % room.points.length];
          // Projection orthogonale du meuble sur le segment
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len2 = dx * dx + dy * dy;
          if (len2 === 0) continue;
          const t = ((x - a.x) * dx + (y - a.y) * dy) / len2;
          if (t >= 0 && t <= 1) {
            const projX = a.x + t * dx;
            const projY = a.y + t * dy;
            const dist = Math.hypot(x - projX, y - projY);
            if (dist < SNAP_DIST) {
              x = projX;
              y = projY;
            }
          }
        }
      }
      furniture[selectedFurniture].x = x - dragOffset.x;
      furniture[selectedFurniture].y = y - dragOffset.y;
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

  function showFurnitureRotateButton() {
    let btn = document.getElementById('furniture-rotate-btn');
    if (btn) btn.remove();
    if (selectedFurniture < 0 || furniture[selectedFurniture].type === 'placard') return;
    btn = document.createElement('button');
    btn.id = 'furniture-rotate-btn';
    btn.textContent = 'Rotation 90°';
    btn.style.position = 'absolute';
    btn.style.left = (furniture[selectedFurniture].x + 20) + 'px';
    btn.style.top = (furniture[selectedFurniture].y - 20) + 'px';
    btn.style.color = '#2563eb';
    btn.style.background = '#fff';
    btn.style.border = '1px solid #2563eb';
    btn.style.borderRadius = '6px';
    btn.style.padding = '2px 8px';
    btn.style.zIndex = '100';
    btn.style.cursor = 'pointer';
    document.body.appendChild(btn);
    btn.addEventListener('click', () => {
      const obj = furniture[selectedFurniture];
      [obj.w, obj.h] = [obj.h, obj.w];
      obj.rot = ((obj.rot ?? 0) + 90) % 360;
      draw();
    });
  }

  // Ajoute les inputs pour modifier les dimensions du lit et du canapé sélectionnés
  function showFurnitureInputs() {
    // Nettoie l'ancien formulaire
    let form = document.getElementById('furniture-form');
    if (form) form.remove();
    if (selectedFurniture < 0) return;
    const obj = furniture[selectedFurniture];
    // Crée le formulaire
    form = document.createElement('form');
    form.id = 'furniture-form';
    form.style.position = 'absolute';
    form.style.left = (obj.x + 20) + 'px';
    form.style.top = (obj.y - 20) + 'px';
    form.style.background = '#fff';
    form.style.border = '1px solid #e5e7eb';
    form.style.borderRadius = '8px';
    form.style.padding = '8px';
    form.style.zIndex = '100';
    let html = '';
    // Champ texte éditable pour le nom/type
    html += `<label style="font-size:12px">Nom&nbsp;: <input type="text" value="${obj.type}" id="furniture-type" style="width:80px" /></label><br />`;
    // Inputs pour largeur/profondeur si applicable
    if (obj.type === 'lit' || obj.type === 'canape' || obj.type === 'placard') {
      html += `<label style="font-size:12px">Largeur (m): <input type="number" step="0.1" min="0.2" value="${obj.w}" id="furniture-w" style="width:50px" /></label>`;
      html += `<label style="font-size:12px;margin-left:8px">Profondeur (m): <input type="number" step="0.1" min="0.2" value="${obj.h}" id="furniture-h" style="width:50px" /></label>`;
    }
    // Boutons rotation et suppression (toujours présents)
    html += `<button type="button" id="furniture-rotate" style="margin-left:12px;color:#2563eb;background:#fff;border:1px solid #2563eb;border-radius:6px;padding:2px 8px;cursor:pointer">Rotation 90°</button>`;
    html += `<button type="button" id="furniture-delete" style="margin-left:12px;color:#ef4444;background:#fff;border:1px solid #ef4444;border-radius:6px;padding:2px 8px;cursor:pointer">Supprimer</button>`;
    form.innerHTML = html;
    document.body.appendChild(form);
    // Gestion du texte éditable
    form.querySelector('#furniture-type')?.addEventListener('change', (e) => {
      obj.type = (e.target as HTMLInputElement).value;
      draw();
    });
    // Gestion des changements largeur/profondeur
    form.querySelector('#furniture-w')?.addEventListener('change', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      if (!isNaN(val) && val > 0) {
        obj.w = val;
        draw();
      }
    });
    form.querySelector('#furniture-h')?.addEventListener('change', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      if (!isNaN(val) && val > 0) {
        obj.h = val;
        draw();
      }
    });
    // Rotation 90°
    form.querySelector('#furniture-rotate')?.addEventListener('click', (e) => {
      obj.rot = ((obj.rot ?? 0) + 90) % 360;
      draw();
    });
    // Suppression
    form.querySelector('#furniture-delete')?.addEventListener('click', (e) => {
      furniture.splice(selectedFurniture, 1);
      selectedFurniture = -1;
      cleanupFurnitureForm();
      cleanupPlacardForm();
      draw();
    });
  }

  // Nettoyage du formulaire si on change de mode ou sélection
  function cleanupFurnitureForm() {
    const form = document.getElementById('furniture-form');
    if (form) form.remove();
  }
  modeEditBtn.addEventListener('click', cleanupFurnitureForm);
  modeDrawBtn.addEventListener('click', cleanupFurnitureForm);
  clearBtn.addEventListener('click', cleanupFurnitureForm);
});
