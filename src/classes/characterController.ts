import { ActionManager, AnimationGroup, ExecuteCodeAction, Mesh, Observable, Scene, ShadowGenerator, Sound, TransformNode, UniversalCamera, Vector3 } from "@babylonjs/core";

export class Player extends TransformNode {
    public camera: UniversalCamera;
    public scene: Scene;
   /** private _input: PLayerInput: */

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
    private static readonly PLAYER_SPEED: number = 0.45;
    private static readonly JUMP_FORCE: number = 0.80;
    private static readonly GRAVITY: number = -2.8;
    // private static readonly DASH_FACTOR: number = 2.5;
    // private static readonly DASH_TIME: number = 10; //how many frames the dash lasts
    // private static readonly DOWN_TILT: Vector3 = new Vector3(0.8290313946973066, 0, 0);
    // private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.5934119456780721, 0, 0);
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


    constructor(assets, scene: Scene, shadowGenerator: ShadowGenerator, /**input?: PlayerInput **/) {
        super("player", scene);
        this.scene = scene;

        // //set up sounds
        // this._loadSounds(this.scene);
        //camera
        // this._setupPlayerCamera();
        this.mesh = assets.mesh;
        this.mesh.parent = this;

        this.scene.getLightByName("sparklight").parent = this.scene.getTransformNodeByName("Empty");

        this._idle = assets.animationGroups[1];
        this._jump = assets.animationGroups[2];
        this._land = assets.animationGroups[3];
        this._run = assets.animationGroups[4];
        this._dash = assets.animationGroups[0];

        //--COLLISIONS--
        this.mesh.actionManager = new ActionManager(this.scene);

        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnIntersectionEnterTrigger,
                    parameter: this.scene.getMeshByName("destination")
                },
                () => {
                   console.log('placeholder')
                }
            )
        );

        //if player falls through "world", reset the position to the last safe grounded position
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction({
                trigger: ActionManager.OnIntersectionEnterTrigger,
                parameter: this.scene.getMeshByName("ground")
            },
                () => {
                    this.mesh.position.copyFrom(this._lastGroundPos); // need to use copy or else they will be both pointing at the same thing & update together
                    //--SOUNDS--
                    // this._resetSfx.play();
                }
            )
        );
        
        //--SOUNDS--
        //observable for when to play the walking sfx
        // this.onRun.add((play) => {
        //     if (play && !this._walkingSfx.isPlaying) {
        //         this._walkingSfx.play();
        //     } else if (!play && this._walkingSfx.isPlaying) {
        //         this._walkingSfx.stop();
        //         this._walkingSfx.isPlaying = false; // make sure that walkingsfx.stop is called only once
        //     }
        // })

        // this._createSparkles(); //create the sparkler particle system
        // this._setUpAnimations();
        shadowGenerator.addShadowCaster(assets.mesh);

        // this._input = input;
    }
}