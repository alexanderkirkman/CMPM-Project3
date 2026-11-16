import { getProp } from '../systems/LightSystem.js';

// A key from the Tiled "triggers" layer (a tile object named "key").

export class Key extends Phaser.Physics.Arcade.Sprite {
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
        this.setImmovable(true);

        // set inactive and invisible
        this.active = false;
        this.body.enable = false;
        this.scale = 0; // ~= invisible

        this.collected = false;

        scene.physics.add.overlap(player, this, () => this.collect());
    }

    reveal() {
        // set key active and visible
        this.active = true;
        this.body.enable = true;
        this.scale = 1;
        // TODO? maybe add a sound effect
    }

    collect() {
        // Turn off the body and hide the sprite, so it can't be picked up twice
        this.disableBody(true, true);
        this.collected = true;
    }
}

export function revealAllKeys(keys) {
    keys.every(k => k.reveal());
}

export function allKeysCollected(keys) {
    return keys.every(k => k.collected);
}