import { TileObject } from './TileObject.js';

// A key from the Tiled "triggers" layer (a tile object named "key").
// It starts hidden and appears once every torch in the level is lit.
export class Key extends TileObject {
    constructor(scene, map, obj, player) {
        super(scene, map, obj);
        this.collected = false;

        // Hidden and untouchable until reveal()
        this.disableBody(true, true);

        scene.physics.add.overlap(player, this, () => this.collect());
    }

    reveal() {
        // Turn the body back on and show the sprite (it stays where Tiled put it)
        this.enableBody(false, 0, 0, true, true);
        // TODO? maybe add a sound effect
    }

    collect() {
        // Turn off the body and hide the sprite, so it can't be picked up twice
        this.disableBody(true, true);
        this.collected = true;
    }
}

export function revealAllKeys(keys) {
    keys.forEach(k => k.reveal());
}

export function allKeysCollected(keys) {
    return keys.every(k => k.collected);
}
