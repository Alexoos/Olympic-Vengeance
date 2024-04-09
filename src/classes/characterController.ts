import {
  ActionManager,
  AnimationGroup,
  ArcRotateCamera,
  ExecuteCodeAction,
  Mesh,
  Observable,
  Scene,
  ShadowGenerator,
  Sound,
  TransformNode,
  UniversalCamera,
  Vector3,
} from '@babylonjs/core';

export class Player extends TransformNode {
  public camera: UniversalCamera;
  public scene: Scene;
  private _input;

  //Player
  public mesh: Mesh; //outer collisionbox of player

  //Camera
  private _camRoot: TransformNode;
  private _yTilt: TransformNode;

  //animations
  private _run: AnimationGroup;
  private _idle: AnimationGroup;
  private _jump: AnimationGroup;
  private _land: AnimationGroup;
  private _dash: AnimationGroup;

  // animation trackers
  private _currentAnim: AnimationGroup = null;
  private _prevAnim: AnimationGroup;
  private _isFalling: boolean = false;
  private _jumped: boolean = false;

  //const values
  private static PLAYER_SPEED: number = 0.45;
  private static JUMP_FORCE: number = 0.8;
  private static GRAVITY: number = -2.8;
  // private static readonly DASH_FACTOR: number = 2.5;
  // private static readonly DASH_TIME: number = 10; //how many frames the dash lasts
  // private static readonly DOWN_TILT: Vector3 = new Vector3(0.8290313946973066, 0, 0);
  private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.5934119456780721, 0, 0);
  // public dashTime: number = 0;

  //player movement vars
  private _deltaTime: number = 0;
  private _h: number;
  private _v: number;

  private _moveDirection: Vector3 = new Vector3();
  private _inputAmt: number;

  //dashing
  // private _dashPressed: boolean;
  // private _canDash: boolean = true;

  //gravity, ground detection, jumping
  private _gravity: Vector3 = new Vector3();
  private _lastGroundPos: Vector3 = Vector3.Zero(); // keep track of the last grounded position
  private _grounded: boolean;
  private _jumpCount: number = 1;

  //sfx
  //  public lightSfx: Sound;
  //  public sparkResetSfx: Sound;
  //  private _resetSfx: Sound;
  //  private _walkingSfx: Sound;
  //  private _jumpingSfx: Sound;
  //  private _dashingSfx: Sound;

  //observables
  public onRun = new Observable();

  constructor(assets, scene: Scene, shadowGenerator: ShadowGenerator, input?) {
    super('player', scene);
    this.scene = scene;
    this._setupPlayerCamera();

    // //set up sounds
    // this._loadSounds(this.scene);
    this.mesh = assets.mesh;
    this.mesh.parent = this;

    shadowGenerator.addShadowCaster(assets.mesh);

    this._input = input;
  }

  private _setupPlayerCamera() : UniversalCamera {
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
    this.camera = new UniversalCamera('cam', new Vector3(0, 0, -30), this.scene);
    this.camera.lockedTarget = this._camRoot.position;
    this.camera.fov = 0.30;
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
}
