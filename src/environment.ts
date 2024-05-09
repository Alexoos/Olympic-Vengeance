import { Scene, SceneLoader, Vector3, Mesh } from '@babylonjs/core';

export class Environment {
  private _scene: Scene;
  private _model: Mesh | null = null;
  private _colosseumMeshes: Mesh[] = []; // Contiendra les meshes du Colisée

  constructor(scene: Scene) {
    this._scene = scene;
  }

  public async load() {
    try {
      // Importer le modèle de manière asynchrone
      const result = await SceneLoader.ImportMeshAsync(
        null, // Importer tous les meshes du fichier
        './models/', // Chemin du répertoire
        'coliseum.glb', // Nom du fichier du modèle
        this._scene // Scène dans laquelle importer le modèle
      );

      // Obtenir les sous-meshes du modèle
      this._colosseumMeshes = result.meshes as Mesh[];

      // Assurez-vous que toutes les sous-meshes sont correctement configurées
      for (const mesh of this._colosseumMeshes) {
        mesh.checkCollisions = true; // Activer les collisions
        mesh.isPickable = true; // Permettre le raycasting
        console.log(`Mesh importé : ${mesh.name}`);
      }

      // Définir le modèle principal pour les ajustements de position/scaling
      this._model = this._colosseumMeshes[0];

      // Ajuster les propriétés du modèle (position, échelle, etc.)
      if (this._model) {
        this._model.position = new Vector3(0, 27, 0); // Ajuster la position selon vos besoins
        this._model.scaling = new Vector3(450, 200, 450); // Modifier l'échelle
      }

    } catch (error) {
      console.error("Erreur lors de l'importation du modèle :", error);
    }
  }

  public getColosseumMeshes(): Mesh[] {
    return this._colosseumMeshes;
  }
}
