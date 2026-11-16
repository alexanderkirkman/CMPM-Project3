import { getProp } from '../systems/LightSystem.js';

// A goal from the Tiled "triggers" layer (a tile object named "goal").

export class Goal extends Phaser.Physics.Arcade.Sprite {
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

        scene.physics.add.overlap(player, this, () => {scene.onGoalContact(this)});
    }

}
