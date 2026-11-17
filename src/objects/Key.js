import { TileObject } from './TileObject.js';
import { SOUNDS } from '../config.js';

// A key from Tiled (a tile object with the class "key").
// It starts hidden and appears once every torch in the level is lit.
export class Key extends TileObject {
    constructor(scene, map, obj, player) {
        super(scene, map, obj);
        this.collected = false;

        // Hidden and untouchable until reveal()
        this.disableBody(true, true);

        scene.physics.add.overlap(player, this, () => this.onTouch());
    }

    reveal() {
        // Turn the body back on and show the sprite (it stays where Tiled put it)
        this.enableBody(false, 0, 0, true, true);
        // TODO? maybe add a sound effect
    }

    onTouch() {
        // Turn off the body and hide the sprite, so it can't be picked up twice
        this.disableBody(true, true);
        this.collected = true;
        this.scene.sound.play('key', { volume: SOUNDS.key.volume });

        // Bigger burst than the gem, in warmer gold. No PixelLight, so it shows up in the dark.
        const burst = this.scene.add.particles(this.x, this.y, 'star04', {
            emitting: false,                     // only fires once, from explode() below
            speed: { min: 50, max: 110 },        // pops out further than the gem
            angle: { min: 0, max: 360 },
            gravityY: -60,
            scale: { start: 0.08, end: 0 },      // bigger stars than the gem (0.05)
            alpha: { start: 1, end: 0 },
            tint: [0xffb02e, 0xffd75e],          // orange-gold and gold, no white
            blendMode: 'ADD',
            lifespan: { min: 500, max: 700 },    // lasts longer than the gem
        });
        burst.explode(16);
        burst.once('complete', () => burst.destroy());   // remove it once every star is gone
    }
}

export function revealAllKeys(keys) {
    keys.forEach(k => k.reveal());
}

export function allKeysCollected(keys) {
    return keys.every(k => k.collected);
}
