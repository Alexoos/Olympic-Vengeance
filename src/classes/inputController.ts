import { Scene, ActionManager, ExecuteCodeAction, Observer, Scalar } from '@babylonjs/core';

export class PlayerInput {
  public inputMap: { [key: string]: boolean } = {};
  private _scene: Scene;

  // Simple movement
  public horizontal: number = 0;
  public vertical: number = 0;

  // Tracks whether or not there is movement in that axis
  public horizontalAxis: number = 0;
  public verticalAxis: number = 0;
  public sprinting: boolean = false;
  public attacking: boolean = false;
  public blocking: boolean = false;

  constructor(scene: Scene) {
      this._scene = scene;
      this._scene.actionManager = new ActionManager(scene);

      // Gérer les touches appuyées
      this._scene.actionManager.registerAction(
          new ExecuteCodeAction({ trigger: ActionManager.OnKeyDownTrigger }, (evt) => {
              this.inputMap[evt.sourceEvent.key.toLowerCase()] = true;
          })
      );

      // Gérer les touches relâchées
      this._scene.actionManager.registerAction(
          new ExecuteCodeAction({ trigger: ActionManager.OnKeyUpTrigger }, (evt) => {
              this.inputMap[evt.sourceEvent.key.toLowerCase()] = false;
          })
      );

      // Appeler une seule méthode lors du rendu
      this._scene.onBeforeRenderObservable.add(() => {
          this.updateInputState();
      });
  }

  public updateInputState(): void {
      // Mise à jour des axes verticaux
      if (this.inputMap['z']) {
          this.verticalAxis = 1;
          this.vertical = 1;
      } else if (this.inputMap['s']) {
          this.verticalAxis = -1;
          this.vertical = -1;
      } else {
          this.verticalAxis = 0;
          this.vertical = 0;
      }

      // Mise à jour des axes horizontaux
      if (this.inputMap['q']) {
          this.horizontalAxis = -1;
          this.horizontal = -1;
      } else if (this.inputMap['d']) {
          this.horizontalAxis = 1;
          this.horizontal = 1;
      } else {
          this.horizontalAxis = 0;
          this.horizontal = 0;
      }

      // Sprint
      this.sprinting = !!this.inputMap['shift'];

      // Attaque
      this.attacking = !!this.inputMap['e'];

      // Blocage
      this.blocking = !!this.inputMap['a'];
  }
}

