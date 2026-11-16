import { TileObject } from './TileObject.js';

// A goal from Tiled (a tile object with the class "goal").
// Touching it tells the level, which checks whether the player has the key.
export class Goal extends TileObject {
    constructor(scene, map, obj, player) {
        super(scene, map, obj);

        scene.physics.add.overlap(player, this, () => this.onTouch());
    }

    onTouch() {
        this.scene.onGoalContact(this);
    }
}
