// Base class for things placed in Tiled as tile objects (gems, keys, goals, spikes, moving platforms).
// It shows the object's tile as a sprite, lit by PixelLight, with a physics body that
// stays where it was placed (no gravity, can't be pushed).
export class TileObject extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, map, obj) {
        const { x, y, key, frame } = tileInfo(map, obj);
        super(scene, x, y, key, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setPipeline('PixelLight');
        this.body.setAllowGravity(false);
        this.setImmovable(true);
    }
}

// ---- Tiled helpers ----

// Where to put a tile object's sprite, and which spritesheet + frame it uses
export function tileInfo(map, obj) {
    // Find which tileset the gid belongs to, to get the right spritesheet + frame
    const tileset = map.tilesets.find(ts => ts.containsTileIndex(obj.gid));
    return {
        // Tiled positions tile objects by their BOTTOM-left corner; Phaser sprites by center
        x: obj.x + obj.width / 2,
        y: obj.y - obj.height / 2,
        key: tileset.image.key,
        frame: obj.gid - tileset.firstgid,
    };
}

// Tiled stores custom properties as [{ name, type, value }, ...]
export function getProp(obj, name) {
    return obj.properties?.find(p => p.name === name)?.value;
}
