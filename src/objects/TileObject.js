// Base class for things placed in Tiled as tile objects (gems, keys, goals, spikes, moving platforms).
// It shows the object's tile as a sprite, lit by PixelLight, with a physics body that
// stays where it was placed (no gravity, can't be pushed).
export class TileObject extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, map, obj) {
        const { x, y, key, frame } = tileInfo(map, obj);
        super(scene, x, y, key, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        applyRotationAndFlip(this, obj);
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

    // Tiled positions tile objects by their BOTTOM-left corner and rotates them around
    // that corner; Phaser sprites use their center. So turn the corner-to-center offset
    // by the object's rotation to find where the center ends up.
    const angle = Phaser.Math.DegToRad(obj.rotation ?? 0);
    const halfW = obj.width / 2;
    const halfH = obj.height / 2;
    return {
        x: obj.x + halfW * Math.cos(angle) + halfH * Math.sin(angle),
        y: obj.y + halfW * Math.sin(angle) - halfH * Math.cos(angle),
        key: tileset.image.key,
        frame: obj.gid - tileset.firstgid,
    };
}

// Makes a sprite match the object's rotation and flips in Tiled.
// Tiled stores flips in the top bits of the gid. Phaser already took them out of obj.gid
// when it loaded the map and saved them as obj.flippedHorizontal / obj.flippedVertical.
export function applyRotationAndFlip(sprite, obj) {
    sprite.setAngle(obj.rotation ?? 0);
    sprite.setFlipX(obj.flippedHorizontal);
    sprite.setFlipY(obj.flippedVertical);
}

// Tiled stores custom properties as [{ name, type, value }, ...]
export function getProp(obj, name) {
    return obj.properties?.find(p => p.name === name)?.value;
}
