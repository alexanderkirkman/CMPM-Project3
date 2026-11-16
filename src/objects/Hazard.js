import { TileObject, getProp } from './TileObject.js';

// A hazard from Tiled: a tile object whose class is in HAZARD_CLASSES (config.js), like "spike".
// The player can stand on it, but can only stand next to it when danger-x is on
// (otherwise they walk straight through its sides). Its "danger-x" and
// "danger-y" bool properties say which sides kill:
//   danger-x: touching its left or right side
//   danger-y: touching its top or bottom
export class Hazard extends TileObject {
    constructor(scene, map, obj, player) {
        super(scene, map, obj);

        // Missing property = false (safe on that side)
        this.dangerX = getProp(obj, 'danger-x') ?? false;
        this.dangerY = getProp(obj, 'danger-y') ?? false;

        // Safe sides: let the player walk straight through instead of bumping into it
        if (!this.dangerX) {
            this.body.checkCollision.left = false;
            this.body.checkCollision.right = false;
        }

        scene.physics.add.collider(player, this, () => this.onTouch());
    }

    // Called after the player bumps into it. touching says which of OUR sides got hit.
    onTouch() {
        const t = this.body.touching;
        if ((this.dangerY && (t.up || t.down)) || (this.dangerX && (t.left || t.right))) {
            this.scene.onPlayerDeath();
        }
    }
}
