// Définition du type Point et Room
export interface Point {
  x: number;
  y: number;
}

export class Room {
  points: Point[] = [];
  selectedPoint: number = -1;
  draggingPoint: boolean = false;
  bboxHandle: null | 'corner' | 'edge' = null;

  constructor(points?: Point[]) {
    if (points) this.points = points;
  }

  // Ajoute un point au contour
  addPoint(p: Point) {
    this.points.push(p);
  }

  // Supprime le point sélectionné
  removeSelectedPoint() {
    if (this.selectedPoint >= 0 && this.points.length > 1) {
      this.points.splice(this.selectedPoint, 1);
      this.selectedPoint = -1;
    }
  }

  // Sélectionne un point proche
  selectPoint(x: number, y: number, threshold = 8): number {
    const idx = this.points.findIndex(p => Math.hypot(p.x - x, p.y - y) < threshold);
    this.selectedPoint = idx;
    return idx;
  }

  // Déplace le point sélectionné
  moveSelectedPoint(x: number, y: number) {
    if (this.selectedPoint >= 0) {
      this.points[this.selectedPoint].x = x;
      this.points[this.selectedPoint].y = y;
    }
  }

  // Dessine le contour sur le contexte canvas
  draw(ctx: CanvasRenderingContext2D, pxPerMeter?: number) {
    if (this.points.length === 0) return;
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      const p = this.points[i];
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();
    // Affichage des cotes (longueur en mètres) sur chaque segment
    if (pxPerMeter) {
      ctx.save();
      ctx.font = '14px Arial';
      ctx.fillStyle = '#2563eb';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < this.points.length; i++) {
        const a = this.points[i];
        const b = this.points[(i + 1) % this.points.length];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const distM = distPx / pxPerMeter;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const perp = { x: -dy, y: dx };
        const norm = Math.sqrt(perp.x * perp.x + perp.y * perp.y);
        const offset = 18;
        const ox = perp.x / norm * offset;
        const oy = perp.y / norm * offset;
        ctx.fillText(distM.toFixed(2) + ' m', mx + ox, my + oy);
      }
      ctx.restore();
    }
    // Dessine les sommets
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === this.selectedPoint ? 8 : 4, 0, Math.PI * 2);
      ctx.fillStyle = i === this.selectedPoint ? '#f59e0b' : '#8b5cf6';
      ctx.fill();
      if (i === this.selectedPoint) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
    }
  }
}
