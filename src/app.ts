import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, FreeCamera, Color4 } from '@babylonjs/core';

/**
 * Enumération pour les états du jeu
 */
enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 }

class App {
  /**
   * Scene de babylon js
   */
    private _scene: Scene;
    /**
     * Canvas HTML où Babylon va afficher la scène 3D
     */
    private _canvas: HTMLCanvasElement;
    /**
     * Moteur de rendu Babylon.js
     */
    private _engine: Engine;


    /**
     * Etat du jeu
     * 0 = début
     * 1 = jeu
     *  2 = perdu
     * 3 = cinématique
     *  
     * */
    private _state: number = 0;

    /**
     *  Crée un canvas HTML et le place dans le body de la page
     * @returns HTMLCanvasElement
     */
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
  
    /**
     * Crée une nouvelle instance de App
     */
    constructor() {
        // initialize babylon scene and engine
        this._canvas = this._createCanvas();
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

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

    private async _main(): Promise<void> {
      // await this._goToStart();

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
                  //if 240seconds/ 4mins have have passed, go to the lose state
                  // if (this._ui.time >= 240 && !this._player.win) {
                  //     this._goToLose();
                  //     this._ui.stopTimer();
                  // }
                  // if (this._ui.quit) {
                  //     this._goToStart();
                  //     this._ui.quit = false;
                  // }
                  this._scene.render();
                  break;
              case State.LOSE:
                  this._scene.render();
                  break;
              default: break;
          }
      });
    
}
}