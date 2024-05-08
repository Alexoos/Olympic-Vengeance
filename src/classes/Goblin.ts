import { Mesh, MeshBuilder, Quaternion, Scalar, Scene, Vector3 } from '@babylonjs/core';
import { Player } from './characterController';

const STATES = Object.freeze({
  STATE_IDLE: 0,
  STATE_SEARCH: 10,
  STATE_FOLLOW: 20,
});

const NORMAL_SPEED = 0.05;
const SPRINT_SPEED = 0.1;

const LOOK_DISTANCE = 6;
const SENS_DISTANCE = 20;

class Goblin {
  mesh: Mesh;
  speed: number;
  distanceFromPlayer: number;
  moveDirection: Vector3 = Vector3.Zero();
  targetPosition: Vector3 = Vector3.Zero();
  playerPosition: Vector3 = Vector3.Zero();
  spawnPoint: Vector3 = Vector3.Zero();
  state: number = STATES.STATE_IDLE;
  nextTargetTime: number = 0;

  constructor() {}

  init() {
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
    this.distanceFromPlayer = Vector3.Distance(this.mesh.absolutePosition, this.playerPosition);

    this.comportement();
    this.move();
  }

  move() {
    if (this.moveDirection.length() != 0) {
      this.moveDirection.y = 0;
      this.moveDirection.scaleInPlace((this.speed * Player._deltaTime) / 1000.0);
      this.mesh.position.addInPlace(this.moveDirection);
    }
  }

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

    if (this.distanceFromPlayer <= LOOK_DISTANCE) {
      this.state = STATES.STATE_FOLLOW;
    } else if (this.distanceFromPlayer <= SENS_DISTANCE) {
      this.state = STATES.STATE_SEARCH;
    } else {
      if (now > this.nextTargetTime) {
        let x = Scalar.RandomRange(0, 5);
        let y = 1;
        let z = Scalar.RandomRange(0, 5);
        this.targetPosition.set(x, y, z);
        this.nextTargetTime = now + 5000;
      }

      this.targetPosition.subtractToRef(this.mesh.absolutePosition, this.moveDirection);
      if (this.moveDirection.length() < 0.001) {
        this.moveDirection.setAll(0);
      } else {
        this.speed = NORMAL_SPEED;
        this.moveDirection.normalize();
      }
    }
  }

  comportementSearch() {
    if (this.distanceFromPlayer <= LOOK_DISTANCE) {
      this.state = STATES.STATE_FOLLOW;
    } else if (this.distanceFromPlayer > SENS_DISTANCE) {
      this.state = STATES.STATE_IDLE;
    } else {
      this.playerPosition.subtractToRef(this.mesh.absolutePosition, this.moveDirection);
      this.moveDirection.addInPlaceFromFloats(Scalar.RandomRange(-2, 2), 0, Scalar.RandomRange(-2, 2));
      if (this.moveDirection.length() < 0.001) {
        this.moveDirection.setAll(0);
      } else {
        this.speed = NORMAL_SPEED;
        this.moveDirection.normalize();
      }
    }
  }

  comportementFollow() {
    if (this.distanceFromPlayer > SENS_DISTANCE) {
      this.state = STATES.STATE_IDLE;
    } else if (this.distanceFromPlayer > LOOK_DISTANCE) {
      this.state = STATES.STATE_SEARCH;
    } else {
      this.playerPosition.subtractToRef(this.mesh.absolutePosition, this.moveDirection);
      if (this.moveDirection.length() < 0.001) {
        this.moveDirection.setAll(0);
      } else {
        this.speed = SPRINT_SPEED;
        this.moveDirection.normalize();
      }
    }
  }
}

export default Goblin;
