import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, FreeCamera, Color4 } from '@babylonjs/core';
import { AdvancedDynamicTexture,  StackPanel, Button, TextBlock, Rectangle, Control, Image } from '@babylonjs/gui';


/**
 * Enumération pour les états du jeu
 */
enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 }

class App {
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _createCanvas(): HTMLCanvasElement {

        //Commented out for development
        document.documentElement.style["overflow"] = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.width = "100%";
        document.documentElement.style.height = "100%";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";
        document.body.style.padding = "0";

        //create the canvas html element and attach it to the webpage
        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.id = "gameCanvas";
        document.body.appendChild(this._canvas);

        return this._canvas;
    }
    private _state: number = 0;

    constructor() {
        this._canvas = this._createCanvas();

        // initialize babylon scene and engine
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), this._scene);
        camera.attachControl(this._canvas, true);
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), this._scene);
        var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, this._scene);

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });

        this._main();
        
    }

    private async _main(): Promise <void>{
        await this._goToStart();
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
    }

    private async _goToStart(): Promise<void> {
        /**
         * Scène setup
         */
        this._engine.displayLoadingUI();
        this._scene.detachControl();
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero());
        this._state = State.START;

        /**
         * GUI
         */

        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight= 720;

        const startBtn= Button.CreateSimpleButton("startBtn", "Start");
        startBtn.width = 0.2;
        startBtn.height = "40px";
        startBtn.color = "white";
        startBtn.top = "-14px";
        startBtn.thickness = 0;
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(startBtn);

        startBtn.onPointerDownObservable.add(() => {
            //this._goToCutScene();
            console.log('Évenement intercepté go to cutscene')
            scene.detachControl(); //observables disabled
        });


        await this._scene.whenReadyAsync();
        this._engine.hideLoadingUI();
        this._scene.dispose();
        this._scene = scene;
        this._state = State.START;
    }
}
new App();



