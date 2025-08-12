// Types partagés pour l'application
export interface Point {
  x: number;
  y: number;
}

export interface FurnitureItem {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  rot?: number;
}
