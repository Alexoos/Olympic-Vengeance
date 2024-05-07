import { Vector3 } from '@babylonjs/core';
import Goblin from './Goblin';

const MAX_GOBLIN = 5;
class EnnemyManager {
  goblins = [];

  constructor() {}

  async init() {
    for (let i = 0; i < MAX_GOBLIN; i++) {
      let goblin = new Goblin();
      await goblin.init();
      goblin.spawn(new Vector3(0, 0, 0));

      this.goblins.push(goblin);
    }
  }

  spawn(spawnPoint: Vector3) {
    for (let i = 0; i < this.goblins.length; i++) {
      let goblin = this.goblins[i];
      goblin.spawn(spawnPoint);
    }
  }

  update(playerPosition) {
    for (let i = 0; i < this.goblins.length; i++) {
      let goblin = this.goblins[i];
      goblin.update(playerPosition);
    }
  }
}

export default EnnemyManager;
