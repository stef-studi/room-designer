// Classe Project : gestion de la liste des rooms et persistance
import { Room } from './room';

export class Project {
  rooms: Room[] = [];
  name: string = '';

  constructor(name?: string) {
    if (name) this.name = name;
  }

  addRoom(room: Room) {
    this.rooms.push(room);
  }

  // (Persistance à ajouter plus tard)
}
