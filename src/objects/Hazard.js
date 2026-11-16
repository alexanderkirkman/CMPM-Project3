import { getProp } from '../systems/LightSystem.js';

// A hazard from Tiled (a tile object with the class "hazard"), like spikes.
// The player can stand on it, but can only stand next to it when danger-x is on
// (otherwise they walk straight through its sides). Its "danger-x" and
// "danger-y" bool properties say which sides kill:
//   danger-x: touching its left or right side
//   danger-y: touching its top or bottom
export class Hazard extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, map, obj, player) {
        // Find which tileset the gid belongs to, to get the right spritesheet + frame
        const tileset = map.tilesets.find(ts => ts.containsTileIndex(obj.gid));
        const frame = obj.gid - tileset.firstgid;
        // Tiled positions tile objects by their BOTTOM-left corner; Phaser sprites by center
        super(scene, obj.x + obj.width / 2, obj.y - obj.height / 2, tileset.image.key, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setPipeline('PixelLight');
        this.body.setAllowGravity(false);   // stays where it was placed
        this.setImmovable(true);            // the player can't push it

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
