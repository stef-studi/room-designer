// Classe Furniture : gestion d'un meuble
import { FurnitureItem } from './types';
import { furnitureIcons } from './icons';

export class Furniture implements FurnitureItem {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  rot: number;

  constructor(item: FurnitureItem) {
    this.x = item.x;
    this.y = item.y;
    this.w = item.w;
    this.h = item.h;
    this.type = item.type;
    this.rot = item.rot ?? 0;
  }

  // Dessine le meuble sur le canevas
    draw(ctx: CanvasRenderingContext2D, pxPerMeter: number, selected: boolean, color: string) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rot * Math.PI) / 180);
  // Utilise le mapping factorisé
  const iconName = furnitureIcons[this.type] || null;
      if (iconName) {
        // Fond semi-transparent sous le picto
        ctx.fillStyle = 'rgba(180,180,190,0.18)';
        ctx.fillRect(-this.w * pxPerMeter / 2, -this.h * pxPerMeter / 2, this.w * pxPerMeter, this.h * pxPerMeter);
        // Cadre discret (gris clair)
        ctx.strokeStyle = selected ? '#2563eb' : '#cbd5e1';
        ctx.lineWidth = selected ? 3 : 1.5;
        ctx.strokeRect(-this.w * pxPerMeter / 2, -this.h * pxPerMeter / 2, this.w * pxPerMeter, this.h * pxPerMeter);
        // Picto SVG sans marge
        const img = new Image();
        img.src = `/icons/${iconName}.svg`;
        img.onload = () => {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate((this.rot * Math.PI) / 180);
          ctx.drawImage(
            img,
            -this.w * pxPerMeter / 2,
            -this.h * pxPerMeter / 2,
            this.w * pxPerMeter,
            this.h * pxPerMeter
          );
          ctx.restore();
        };
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(-this.w * pxPerMeter / 2, -this.h * pxPerMeter / 2, this.w * pxPerMeter, this.h * pxPerMeter);
        ctx.font = '13px Arial';
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type, 0, 0);
        ctx.strokeStyle = selected ? '#2563eb' : '#cbd5e1';
        ctx.lineWidth = selected ? 3 : 1.5;
        ctx.strokeRect(-this.w * pxPerMeter / 2, -this.h * pxPerMeter / 2, this.w * pxPerMeter, this.h * pxPerMeter);
      }
      ctx.restore();
    }

  // Tourne le meuble de 90°
  rotate() {
    [this.w, this.h] = [this.h, this.w];
    this.rot = (this.rot + 90) % 360;
  }
}
