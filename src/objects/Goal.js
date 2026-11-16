import { TileObject } from './TileObject.js';

// A goal from the Tiled "triggers" layer (a tile object named "goal").
// Touching it tells the level, which checks whether the player has the key.
export class Goal extends TileObject {
    constructor(scene, map, obj, player) {
        super(scene, map, obj);

        scene.physics.add.overlap(player, this, () => this.reach());
    }

    reach() {
        this.scene.onGoalContact(this);
    }
}
