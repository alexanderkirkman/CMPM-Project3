import { getProp } from '../systems/LightSystem.js';

// A gem from the Tiled "triggers" layer (a tile object named "gem").
// Touching it collects it and adds its "value" property (default 1) to the level's gem count.
export class Gem extends Phaser.Physics.Arcade.Sprite {
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

        this.value = getProp(obj, 'value') ?? 1;

        scene.physics.add.overlap(player, this, () => this.collect());
    }

    collect() {
        // Turn off the body and hide the sprite, so it can't be picked up twice
        this.disableBody(true, true);
        this.scene.addGems(this.value);

        // Little burst of gold/white stars. No PixelLight, so it shows up in the dark.
        const burst = this.scene.add.particles(this.x, this.y, 'star04', {
            emitting: false,                     // only fires once, from explode() below
            speed: { min: 40, max: 80 },         // how far they pop out
            angle: { min: 0, max: 360 },         // all directions...
            gravityY: -80,                       // ...drifting slightly up
            scale: { start: 0.05, end: 0 },      // image is 512px but soft, so 0.05 shows a ~8px star
            alpha: { start: 1, end: 0 },
            tint: [0xffd75e, 0xffffff],          // each star is gold or white
            blendMode: 'ADD',                    // glows, so the soft image still reads as bright
            lifespan: { min: 300, max: 400 },
        });
        burst.explode(9);
        burst.once('complete', () => burst.destroy());   // remove it once every star is gone
    }
}
