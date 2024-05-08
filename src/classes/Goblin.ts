import { Mesh, MeshBuilder, Quaternion, Scalar, Scene, Vector, Vector3 } from '@babylonjs/core';

const STATES = Object.freeze({
  STATE_IDLE: 0,
  STATE_SEARCH: 10,
  STATE_FOLLOW: 20,
});

const NORMAL_SPEED = 0.05;
const SPRINT_SPEED = 0.1;

const LOOK_DISTANCE = 6;
const SENS_DISTANCE = 20;

const life = 20;
const damage = 6;

class Goblin {
  mesh: Mesh;

  scene: Scene;
  normal_speed: number;
  moveDirection: Vector3 = Vector3.Zero();
  targetPosition: Vector3 = Vector3.Zero();
  playerPosition: Vector3 = Vector3.Zero();
  spawnPoint: Vector3 = Vector3.Zero();
  state = STATES.STATE_IDLE;
  nextTargetTime = 0;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async init() {
    this.mesh = MeshBuilder.CreateCapsule('goblin', { radius: 0.25, height: 1 });
    this.mesh.position = new Vector3(0, 1, 0);
  }

  spawn(spawnPoint: Vector3) {
    this.spawnPoint = spawnPoint;

    this.mesh.position.copyFrom(this.spawnPoint);
    this.mesh.rotationQuaternion = Quaternion.Identity();
    this.moveDirection.setAll(0);

    this.nextTargetTime = 0;
  }

  update(playerPosition: Vector3) {
    this.playerPosition.copyFrom(playerPosition);

    this.comportement();

    this.move();
  }

  move() {}

  comportement() {
    if (this.state == STATES.STATE_IDLE) {
      this.comportementIdle();
    } else if (this.state == STATES.STATE_SEARCH) {
      this.comportementSearch();
    } else if (this.state == STATES.STATE_FOLLOW) {
      this.comportementFollow();
    }
  }

  comportementIdle() {
    let now = performance.now();

    if (now > this.nextTargetTime) {
      //Choix destination
      //A modifier pour faire tourner dans la zone voulu (x et y) en gros il fait une ronde dans une zone
      let x = Scalar.RandomRange(0, 5);
      let y = 1;
      let z = 0;
      this.targetPosition.set(5, y, 5);
      this.nextTargetTime = now + 5000;
    }

    this.targetPosition.subtractToRef(this.mesh.absolutePosition, this.moveDirection);
    if (this.moveDirection.length() < 0.001) {
      this.moveDirection.setAll(0);
    } else {
      this.normal_speed = NORMAL_SPEED;
      this.moveDirection.normalize();
    }

    if (this.moveDirection.length() != 0) {
      this.moveDirection.y = 0;
      this.moveDirection.scaleInPlace((this.normal_speed * this.scene.getEngine().getDeltaTime()) / 1000.0);
      this.mesh.position.addInPlace(this.moveDirection);
    }
  }

  comportementSearch() {}

  comportementFollow() {}
}

export default Goblin;
