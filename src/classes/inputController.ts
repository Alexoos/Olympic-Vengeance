import { Scene, ActionManager, ExecuteCodeAction, Observer, Scalar } from '@babylonjs/core';

export class PlayerInput {
  public inputMap: any;
  private _scene: Scene;

  //simple movement
  public horizontal: number = 0;
  public vertical: number = 0;

  //tracks whether or not there is movement in that axis
  public horizontalAxis: number = 0;
  public verticalAxis: number = 0;
  public sprinting: boolean;
  public attacking: boolean;
  public blocking: boolean;
  public dashing: boolean;

  constructor(scene: Scene) {
    scene.actionManager = new ActionManager(scene);

    this.inputMap = {};
    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == 'keydown';
      }),
    );
    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == 'keydown';
      }),
    );

    scene.onBeforeRenderObservable.add(() => {
      this._updateFromKeyboard();
    });
  }

  private _updateFromKeyboard(): void {
    if (this.inputMap['z']) {
      this.vertical = Scalar.Lerp(this.vertical, 1, 0.02);
      this.verticalAxis = 1;
    } else if (this.inputMap['s']) {
      this.vertical = Scalar.Lerp(this.vertical, -1, 0.02);
      this.verticalAxis = -1;
    } else {
      this.vertical = 0;
      this.verticalAxis = 0;
    }

    if (this.inputMap['q']) {
      this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.02);
      this.horizontalAxis = -1;
    } else if (this.inputMap['d']) {
      this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.02);
      this.horizontalAxis = 1;
    } else {
      this.horizontal = 0;
      this.horizontalAxis = 0;
    }

    //sprint
    if (this.inputMap['Shift']) {
      this.sprinting = true;
    } else {
      this.sprinting = false;
    }

    //attacking
    if (this.inputMap['e']) {
      this.attacking = true;
    } else {
      this.attacking = false;
    }

    //blocking
    if (this.inputMap['a']) {
      this.blocking = true;
    } else {
      this.blocking = false;
    }
  }
}
