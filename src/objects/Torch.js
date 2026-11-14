import { getProp } from '../systems/LightSystem.js';

// A torch from the Tiled "lights" layer (an object named "torch").
// It starts unlit if its "active" property is false, and lights up when the player touches it.
export class Torch {
    constructor(scene, light, player) {
        this.scene = scene;
        this.light = light;            // the entry LightSystem made for this torch
        this.sprite = light.sprite;
        this.lit = getProp(light.obj, 'active') !== false;
        light.on = this.lit;           // LightSystem keeps an "off" light dark

        // Physics body so we can tell when the player overlaps it.
        // Immovable and capped at 0 speed so gravity doesn't pull it down.
        scene.physics.add.existing(this.sprite);
        this.sprite.body.immovable = true;
        this.sprite.body.maxVelocity.x = 0;
        this.sprite.body.maxVelocity.y = 0;

        scene.physics.add.overlap(player, this.sprite, () => {
            if (!this.lit) {
                this.turnOn();
                scene.onTorchLit();
            }
        });
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
