export default class Container {
  constructor(public id: number, public items: Array<Item | null>) {
  }

  public hasItem(itemType: number) {
    for (const item of this.items) {
      if (item && item.type === itemType) return true;
    }
    return false;
  }
}
