import {
  AbstractMesh,
  ActionManager,
  AnimationGroup,
  ArcRotateCamera,
  ExecuteCodeAction,
  Mesh,
  Observable,
  Quaternion,
  Ray,
  Scene,
  ShadowGenerator,
  Sound,
  TransformNode,
  UniversalCamera,
  Vector3,
} from '@babylonjs/core';
import { PlayerInput } from './inputController';

export class Player extends TransformNode {
  public camera: UniversalCamera;
  public scene: Scene;
  private _input: PlayerInput;

  //Player
  public mesh: Mesh; //outer collisionbox of player
  private health: number;
  private damage: number;

  //Camera
  private _camRoot: TransformNode;
  private _yTilt: TransformNode;

  //animations
  private _run: AnimationGroup;
  private _idle: AnimationGroup;
  private _walk: AnimationGroup;
  private _attack: AnimationGroup;
  private _block: AnimationGroup;
  private _damage: AnimationGroup;
  private _dash: AnimationGroup;

  // animation trackers
  private _currentAnim: AnimationGroup = null;
  private _prevAnim: AnimationGroup;
  private _isFalling: boolean = false;
  private _jumped: boolean = false;

  //const values
  private static NORMAL_SPEED: number = 0.17;
  private static SPRINT_SPEED: number = 0.35;
  private static JUMP_FORCE: number = 0.3;
  private static GRAVITY: number = -10;
  // private static readonly DASH_FACTOR: number = 2.5;
  // private static readonly DASH_TIME: number = 10; //how many frames the dash lasts
  // private static readonly DOWN_TILT: Vector3 = new Vector3(0.8290313946973066, 0, 0);
  private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.5934119456780721, 0, 0);
  // public dashTime: number = 0;

  //player movement vars
  public _deltaTime: number = 0;
  private _h: number;
  private _v: number;

  private _moveDirection: Vector3 = new Vector3();
  private _inputAmt: number;

  //dashing
  // private _dashPressed: boolean;
  // private _canDash: boolean = true;

  //gravity, ground detection, jumping
  private _lastGroundPos: Vector3 = Vector3.Zero(); // keep track of the last grounded position
  private _gravity: Vector3 = new Vector3();
  private _grounded: boolean;

  //sfx
  //  public lightSfx: Sound;
  //  public sparkResetSfx: Sound;
  //  private _resetSfx: Sound;
  //  private _walkingSfx: Sound;
  //  private _jumpingSfx: Sound;
  //  private _dashingSfx: Sound;

  //observables
  public onRun = new Observable();
  static _deltaTime: number;
  static mesh: Mesh;
  static health: number;
  hacheMesh: AbstractMesh;

  constructor(assets, scene: Scene, shadowGenerator: ShadowGenerator, input?) {
    super('kolasis', scene);
    this.scene = scene;
    this._setupPlayerCamera();

    // //set up sounds
    // this._loadSounds(this.scene);
    this.mesh = assets.mesh;
    this.mesh.parent = this;

    let childMeshes = this.mesh.getChildMeshes();

    // Parcourez tous les meshes pour trouver celui avec le nom spécifique
    childMeshes.forEach((mesh) => {
      // Vérifiez si le mesh a le nom que vous recherchez
      if (mesh.name === 'BattleAxe_GEO') {
        // Si c'est le cas, assignez ce mesh à votre variable
        this.hacheMesh = mesh;
      }
    });

    this.health = 100;
    this.damage = 20;

    shadowGenerator.addShadowCaster(assets.mesh);

    this._input = input;

    this._idle = assets.animationGroups[3];
    this._walk = assets.animationGroups[5];
    this._run = assets.animationGroups[4];
    this._attack = assets.animationGroups[0];
    this._block = assets.animationGroups[1];

    this._setUpAnimations();

    // Définissez un gestionnaire de collision
    this.scene.onBeforeRenderObservable.add(() => {
      this.detectCollisions();
    });
  }

  private _setupPlayerCamera(): UniversalCamera {
    //root camera parent that handles positioning of the camera to follow the player
    this._camRoot = new TransformNode('root');
    this._camRoot.position = new Vector3(0, 0, 0); //initialized at (0,0,0)
    //to face the player from behind (180 degrees)
    this._camRoot.rotation = new Vector3(0, Math.PI, 0);

    //rotations along the x-axis (up/down tilting)
    let yTilt = new TransformNode('ytilt');
    //adjustments to camera view to point down at our player
    yTilt.rotation = Player.ORIGINAL_TILT;
    this._yTilt = yTilt;
    yTilt.parent = this._camRoot;

    //our actual camera that's pointing at our root's position
    this.camera = new UniversalCamera('cam', new Vector3(0, 0, -60), this.scene);
    this.camera.lockedTarget = this._camRoot.position;
    this.camera.fov = 0.3;
    this.camera.parent = yTilt;

    this.scene.activeCamera = this.camera;
    return this.camera;
  }

  private _updateCamera(): void {
    let centerPlayer = this.mesh.position.y + 2;
    this._camRoot.position = Vector3.Lerp(
      this._camRoot.position,
      new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z),
      0.4,
    );
  }

  private _updateFromControls(): void {
    this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
    this._moveDirection = Vector3.Zero(); // initialise le vecteur de direction

    // récupère les entrées utilisateur
    this._h = this._input.horizontal; // x-axis
    this._v = this._input.vertical; // z-axis

    // mouvements basés sur l'angle de la caméra
    let fwd = this._camRoot.forward;
    let right = this._camRoot.right;
    let correctedVertical = fwd.scaleInPlace(this._v);
    let correctedHorizontal = right.scaleInPlace(this._h);
    let move = correctedHorizontal.addInPlace(correctedVertical);

    // normalisation pour empêcher le personnage de voler
    this._moveDirection = new Vector3(move.normalize().x, 0, move.normalize().z);

    // définition de la vitesse en fonction du sprint
    let speed = this._input.sprinting ? Player.SPRINT_SPEED : Player.NORMAL_SPEED;
    this._moveDirection = this._moveDirection.normalize().scale(speed);

    // gestion de la rotation pour toujours pointer dans la direction correcte
    if (move.length() > 0) {
      let angle = Math.atan2(this._input.horizontalAxis, this._input.verticalAxis);
      angle += this._camRoot.rotation.y;
      let targ = Quaternion.FromEulerAngles(0, angle, 0);
      this.mesh.rotationQuaternion = Quaternion.Slerp(this.mesh.rotationQuaternion, targ, 5 * this._deltaTime);
    }
  }

  //--GROUND DETECTION--
  //Send raycast to the floor to detect if there are any hits with meshes below the character
  private _floorRaycast(offsetx: number, offsetz: number, raycastlen: number): Vector3 {
    //position the raycast from bottom center of mesh
    let raycastFloorPos = new Vector3(
      this.mesh.position.x + offsetx,
      this.mesh.position.y + 0.5,
      this.mesh.position.z + offsetz,
    );
    let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);

    //defined which type of meshes should be pickable
    let predicate = function (mesh) {
      return mesh.isPickable && mesh.isEnabled();
    };

    let pick = this.scene.pickWithRay(ray, predicate);

    if (pick.hit) {
      //grounded
      return pick.pickedPoint;
    } else {
      //not grounded
      return Vector3.Zero();
    }
  }

  private _updateGroundDetection(): void {
    let groundPoint = this._floorRaycast(0, 0, 2);
    if (!groundPoint.equals(Vector3.Zero())) {
      // Positionne le joueur au niveau du sol détecté
      this.mesh.position.y = groundPoint.y;
      this._gravity.y = 0;
      this._grounded = true;
    } else {
      // Continue d'appliquer la gravité s'il n'est pas au sol
      this._gravity = this._gravity.addInPlace(Vector3.Up().scale(this._deltaTime * Player.GRAVITY));
      this._grounded = false;
    }

    // Déplace le personnage avec les collisions
    this.mesh.moveWithCollisions(this._moveDirection.addInPlace(this._gravity));
  }

  private _setUpAnimations(): void {
    this.scene.stopAllAnimations();
    this._walk.loopAnimation = true;
    this._run.loopAnimation = true;
    this._idle.loopAnimation = true;

    //initialize current and previous
    this._currentAnim = this._idle;
    this._prevAnim = this._walk;
  }

  private _animatePlayer(): void {
    this._currentAnim = this._idle;

    if (
      (this._input.inputMap['z'] ||
        this._input.inputMap['s'] ||
        this._input.inputMap['q'] ||
        this._input.inputMap['d']) &&
      !this._input.sprinting
    ) {
      this._currentAnim = this._walk;
    } else if (
      (this._input.inputMap['z'] ||
        this._input.inputMap['s'] ||
        this._input.inputMap['q'] ||
        this._input.inputMap['d']) &&
      this._input.sprinting
    ) {
      this._currentAnim = this._run;
    } else if (this._input.attacking) {
      this._currentAnim = this._attack;
    } else if (this._input.blocking) {
      this._currentAnim = this._block;
    }
    if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
      //Animations
      this._prevAnim.stop();
      this._currentAnim.play(this._currentAnim.loopAnimation);
      this._prevAnim = this._currentAnim;
    }
  }

  public activatePlayerCamera(): UniversalCamera {
    this.scene.registerBeforeRender(() => {
      this._beforeRenderUpdate();
      this._updateCamera();
    });
    return this.camera;
  }

  private _beforeRenderUpdate(): void {
    this._input.updateInputState();
    this._updateFromControls();
    this._updateGroundDetection();
    this._animatePlayer();
  }

  public getPosition(): Vector3 {
    return this.mesh.absolutePosition;
  }

  public detectCollisions() {
    // Boucle à travers tous les meshes de la scène pour vérifier les collisions avec le joueur
    this.scene.meshes.forEach((otherMesh) => {
      // Vérifiez si le mesh est différent du mesh du joueur
      if (otherMesh !== this.mesh && otherMesh !== this.hacheMesh) {
        // Vérifiez s'il y a une collision entre le mesh du joueur et le mesh actuel
        if (this.hacheMesh.intersectsMesh(otherMesh, true)) {
          // Collision détectée, vous pouvez effectuer des actions ici
          console.log('Collision avec le mesh :', otherMesh.name);
        }
      }
    });
  }

  public setHealth(nb: number): number {
    if (this.health - nb > 0 && this._currentAnim !== this._block) {
      this.health -= nb;
    } else {
      //etat de mort faire en sorte que le jeu s'arrete
    }
    return this.health;
  }

  public dealDamage(damage: number) {}
}
