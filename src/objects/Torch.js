import { getProp } from './TileObject.js';

// A torch from Tiled (an object with the class "torch"). LightSystem makes its light.
// It starts unlit if its "active" property is false, and lights up when the player touches it.
export class Torch {
    constructor(scene, light, player) {
        this.scene = scene;
        this.light = light;            // the entry LightSystem made for this torch
        this.sprite = light.sprite;
        this.lit = getProp(light.obj, 'active') !== false;
        light.on = this.lit;           // LightSystem keeps an "off" light dark

        // Physics body so we can tell when the player overlaps it.
        // Same setup as TileObject: no gravity and can't be pushed.
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setAllowGravity(false);
        this.sprite.body.setImmovable(true);

        scene.physics.add.overlap(player, this.sprite, () => this.onTouch());
    }

    onTouch() {
        if (!this.lit) {
            this.turnOn();
            this.scene.onTorchLit();
        }
    }

    turnOn() {
        this.lit = true;
        this.light.on = true;

        // Puff of smoke to show the torch catching
        const particles = this.scene.add.particles(0, 0, 'smoke10', {
            scale: { start: 0.01, end: 0.02, random: true },
            angle: { min: 250, max: 290 },
            x: this.sprite.x,
            y: this.sprite.y,
            gravityY: -125,
            speed: 50,
            duration: 200,
            lifespan: { min: 150, max: 250 },
        });
        particles.setPipeline('PixelLight');
    }
}

export function allTorchesLit(torches) {
    return torches.every(t => t.lit);
}
