export default class Player {
  public id: number;
  public isAdmin: boolean;
  public creature: Creature;
  // skill id -> xp
  public skills: Map<number, number> = new Map();
}
