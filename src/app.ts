import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  FreeCamera,
  Color4,
  Matrix,
  Quaternion,
  SceneLoader,
  Color3,
  StandardMaterial,
  ShadowGenerator,
  PointLight,
  ActionManager,
  ExecuteCodeAction,
} from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { Player } from './classes/characterController';
import { Environment } from './environment';
import { PlayerInput } from './classes/inputController';
import EnnemyManager from './classes/EnnemyManager';
import Goblin from './classes/Goblin';

enum State {
  START = 0,
  GAME = 1,
  LOSE = 2,
  CUTSCENE = 3,
  WIN = 4,
}

export class App {
  // General Entire Application
  public assets;
  private _scene: Scene;
  private _canvas: HTMLCanvasElement;
  private _engine: Engine;

  //Scene - related
  private _state: number = 0;
  private _gamescene: Scene;
  private _cutScene: Scene;
  private _player: Player;
  private _goblin: Goblin;
  private _environment: Environment;
  private updateInterval: NodeJS.Timeout;
  private _input: PlayerInput;
  private _ennemyManager: EnnemyManager;

  constructor() {
    this._canvas = this._createCanvas();

    // initialize babylon scene and engine
    this._engine = new Engine(this._canvas, true);
    this._scene = new Scene(this._engine);
    this._scene.collisionsEnabled = true;

    // hide/show the Inspector
    window.addEventListener('keydown', (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        if (this._scene.debugLayer.isVisible()) {
          this._scene.debugLayer.hide();
        } else {
          this._scene.debugLayer.show();
        }
      }
    });

    // run the main render loop
    window['gameApp'] = this;
    this._main();
  }

  private _createCanvas(): HTMLCanvasElement {
    //Commented out for development
    document.documentElement.style['overflow'] = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    //create the canvas html element and attach it to the webpage
    this._canvas = document.createElement('canvas');
    this._canvas.style.width = '100%';
    this._canvas.style.height = '100%';
    this._canvas.id = 'gameCanvas';
    document.body.appendChild(this._canvas);

    return this._canvas;
  }

  private async _main(): Promise<void> {
    await this._goToStart();

    // Register a render loop to repeatedly render the scene
    this._engine.runRenderLoop(() => {
      switch (this._state) {
        case State.START:
          this._scene.render();
          break;
        case State.CUTSCENE:
          this._scene.render();
          break;
        case State.GAME:
          this._scene.render();
          this._ennemyManager.update(this._player.getPosition());
          break;
        case State.LOSE:
          this._scene.render();
          break;
        case State.WIN:
          this._scene.render();
          break;
        default:
          break;
      }
    });

    //resize if the screen is resized/rotated
    window.addEventListener('resize', () => {
      this._engine.resize();
    });
  }

  private handleButtonEnter(buttonName): void {
    switch (buttonName) {
      case 'play':
        this._goToGame();
        break;
      // Add more cases if needed for other buttons
    }
    console.log(`Button ${buttonName} hovered`);
  }

  private async _goToStart() {
    this._engine.displayLoadingUI();

    this._scene.detachControl();
    let scene = new Scene(this._engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    let camera = new FreeCamera('camera1', new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());

    //create a fullscreen ui for all of our GUI elements
    const guiMenu = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    guiMenu.idealHeight = 720; //fit our fullscreen ui to this height
    const backgroundImage = new GUI.Image('background', 'background.jpg');
    backgroundImage.width = 1; // Full width
    backgroundImage.height = 1; // Full height
    backgroundImage.stretch = GUI.Image.STRETCH_FILL;
    guiMenu.addControl(backgroundImage);

    const logo = new GUI.Image('logo', 'favicon.png');
    logo.width = '250px'; // Set the width as needed
    logo.height = '250px'; // Set the height as needed
    logo.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    logo.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    logo.top = '120px'; // Adjust this to position the logo correctly
    guiMenu.addControl(logo);

    const panel = new GUI.StackPanel();
    panel.width = '1500px';
    panel.top = '50px';
    panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    guiMenu.addControl(panel);
    const playButton = GUI.Button.CreateSimpleButton('play', 'Nouvelle Partie');
    playButton.width = '400px';
    playButton.height = '50px';
    playButton.color = 'white';
    playButton.cornerRadius = 20;
    playButton.background = 'transparent';
    playButton.fontSize = '20px';
    playButton.hoverCursor = 'pointer';
    playButton.paddingTop = '10px';
    playButton.paddingBottom = '10px';
    playButton.paddingLeft = '10px';
    playButton.paddingRight = '10px';
    playButton.thickness = 0;
    playButton.background = 'white';
    playButton.color = 'black';
    // panel.addControl(logo);
    panel.addControl(playButton);
    playButton.onPointerClickObservable.add(() => {
      this.handleButtonEnter('play');
    });

    //--SCENE FINISHED LOADING--
    await scene.whenReadyAsync();
    this._engine.hideLoadingUI();
    //lastly set the current state to the start state and set the scene to the start scene
    this._scene.dispose();
    this._scene = scene;
    this._state = State.START;
    var finishedLoading = false;
    await this._setUpGame().then((res) => {
      finishedLoading = true;
    });
  }

  private async _loadCharacterAssets(scene): Promise<any> {
    async function loadCharacter() {
      //collision mesh
      const outer = MeshBuilder.CreateBox('outer', { width: 2, depth: 1, height: 3 }, scene);
      outer.isVisible = false;
      outer.isPickable = false;
      outer.checkCollisions = true;

      //move origin of box collider to the bottom of the mesh (to match player mesh)
      outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0));
      //for collisions
      outer.ellipsoid = new Vector3(1, 1.5, 1);
      outer.ellipsoidOffset = new Vector3(0, 1.5, 0);

      outer.rotationQuaternion = new Quaternion(0, 1, 0, 0); // rotate the player mesh 180 since we want to see the back of the player
      var box = MeshBuilder.CreateBox(
        'Small1',
        {
          width: 0.5,
          depth: 0.5,
          height: 0.25,
          faceColors: [
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
          ],
        },
        scene,
      );
      box.position.y = 1.5;
      box.position.z = 1;

      //--IMPORTING MESH--
      return SceneLoader.ImportMeshAsync(null, './models/', 'kolasis.glb', scene).then((result) => {
        const root = result.meshes[0];
        //body is our actual player mesh
        const body = root;
        body.parent = outer;
        body.isPickable = false;
        body.getChildMeshes().forEach((m) => {
          m.isPickable = false;
        });

        //return the mesh and animations
        return {
          mesh: outer as Mesh,
          animationGroups: result.animationGroups,
        };
      });
    }

    return loadCharacter().then((assets) => {
      this.assets = assets;
    });
  }

  private async _initializeGameAsync(scene): Promise<void> {
    //temporary light to light the entire scene
    var light0 = new HemisphericLight('HemiLight', new Vector3(0, 1, 0), scene);

    const light = new PointLight('sparklight', new Vector3(0, 0, 0), scene);
    light.diffuse = new Color3(0.08627450980392157, 0.10980392156862745, 0.15294117647058825);
    light.intensity = 35;
    light.radius = 1;

    const shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.darkness = 0.4;

    //Create the environment
    this._environment = new Environment(scene);
    await this._environment.load();

    //Create the player
    this._player = new Player(this.assets, scene, shadowGenerator, this._input);
    this._ennemyManager = new EnnemyManager(scene, this._player);
    await this._ennemyManager.init(this._player.getPosition());

    //player camera
    const camera = this._player.activatePlayerCamera();
  }

  private async _setUpGame() {
    let scene = new Scene(this._engine);

    this._gamescene = scene;
    await this._loadCharacterAssets(scene);

    //...load assets
  }

  private async _goToGame() {
    //--SETUP SCENE--
    this._scene.detachControl();
    let scene = this._gamescene;

    //--INPUT--
    this._input = new PlayerInput(scene); //detect keyboard/mobile inputs

    await this._initializeGameAsync(scene);

    //--GUI--
    const playerUI = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    scene.detachControl();

    //--WHEN SCENE FINISHED LOADING--
    await scene.whenReadyAsync();
    // a modifier pour peut etre faire spawn en random ? dans la map
    scene.getMeshByName('outer').position = new Vector3(50, 0, 18);
    //get rid of start scene, switch to gamescene and change states
    this._scene.dispose();
    this._state = State.GAME;
    //this.startGoblinUpdateInterval();
    this._scene = scene;
    this._engine.hideLoadingUI();

    //the game is ready, attach control back
    this._scene.attachControl();
  }

  private async _goToLose(): Promise<void> {
    this._engine.displayLoadingUI();

    //--SCENE SETUP--
    this._scene.detachControl();
    let scene = new Scene(this._engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    let camera = new FreeCamera('camera1', new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());

    //--GUI--
    const guiMenu = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    guiMenu.idealHeight = 720; //fit our fullscreen ui to this height
    const backgroundImage = new GUI.Image('background', 'background.jpg');
    backgroundImage.width = 1; // Full width
    backgroundImage.height = 1; // Full height
    backgroundImage.stretch = GUI.Image.STRETCH_FILL;
    guiMenu.addControl(backgroundImage);

    // Game Over Text
    const gameOverText = new GUI.TextBlock();
    gameOverText.text = 'GAME OVER';
    gameOverText.color = 'white';
    gameOverText.fontSize = 50;
    gameOverText.height = '100px';
    gameOverText.top = '-100px'; // Adjust position to be above the button
    gameOverText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    gameOverText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    guiMenu.addControl(gameOverText);

    // Main Menu Button
    const mainBtn = GUI.Button.CreateSimpleButton('mainmenu', 'MENU PRINCIPAL');
    mainBtn.width = '400px';
    mainBtn.height = '50px';
    mainBtn.color = 'red';
    mainBtn.cornerRadius = 20;
    mainBtn.background = 'transparent';
    mainBtn.fontSize = '20px';
    mainBtn.hoverCursor = 'pointer';
    mainBtn.paddingTop = '10px';
    mainBtn.paddingBottom = '10px';
    mainBtn.paddingLeft = '10px';
    mainBtn.paddingRight = '10px';
    mainBtn.thickness = 0;
    mainBtn.background = 'white';
    mainBtn.color = 'black';
    mainBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    guiMenu.addControl(mainBtn);
    mainBtn.onPointerUpObservable.add(() => {
      this._goToStart();
    });

    //--SCENE FINISHED LOADING--
    await scene.whenReadyAsync();
    this._engine.hideLoadingUI(); //when the scene is ready, hide loading
    //lastly set the current state to the lose state and set the scene to the lose scene
    this._scene.dispose();
    this._scene = scene;
    this._state = State.LOSE;
  }

  // App.ts
  private async _goToWin(): Promise<void> {
    this._engine.displayLoadingUI();

    // Detach controls from the current scene before switching
    this._scene.detachControl();
    let scene = new Scene(this._engine);
    scene.clearColor = new Color4(0, 0, 0, 1);

    // Set up a camera for the new scene
    let camera = new FreeCamera('winCamera', new Vector3(0, 0, -10), scene);
    camera.setTarget(Vector3.Zero());
    scene.activeCamera = camera; // Make sure to set the active camera

    // Setup GUI
    const guiMenu = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    guiMenu.idealHeight = 720; //fit our fullscreen ui to this height
    const backgroundImage = new GUI.Image('background', 'background.jpg');
    backgroundImage.width = 1; // Full width
    backgroundImage.height = 1; // Full height
    backgroundImage.stretch = GUI.Image.STRETCH_FILL;
    guiMenu.addControl(backgroundImage);

    // You Win Text
    const youWinText = new GUI.TextBlock();
    youWinText.text = 'YOU WIN';
    youWinText.color = 'white';
    youWinText.fontSize = 50;
    youWinText.height = '100px';
    youWinText.top = '-100px'; // Adjust position to be above the button
    youWinText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    youWinText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    guiMenu.addControl(youWinText);
    // Main Menu Button
    const mainBtn = GUI.Button.CreateSimpleButton('mainmenu', 'MENU PRINCIPAL');
    mainBtn.width = '400px';
    mainBtn.height = '50px';
    mainBtn.color = 'red';
    mainBtn.cornerRadius = 20;
    mainBtn.background = 'transparent';
    mainBtn.fontSize = '20px';
    mainBtn.hoverCursor = 'pointer';
    mainBtn.paddingTop = '10px';
    mainBtn.paddingBottom = '10px';
    mainBtn.paddingLeft = '10px';
    mainBtn.paddingRight = '10px';
    mainBtn.thickness = 0;
    mainBtn.background = 'white';
    mainBtn.color = 'black';
    mainBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    guiMenu.addControl(mainBtn);
    mainBtn.onPointerUpObservable.add(() => {
      this._goToStart();
    });

    // Ensure the scene is ready before showing
    await scene.whenReadyAsync();
    this._engine.hideLoadingUI();

    // Dispose of the old scene and update to the new one
    this._scene.dispose();
    this._scene = scene;
    this._state = State.WIN; // Update the state to WIN or another appropriate state
  }
}
new App();
