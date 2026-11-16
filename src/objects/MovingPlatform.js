import { TileObject, getProp } from './TileObject.js';
import { PLATFORM_SPEED } from '../config.js';

// A moving platform from Tiled (a tile object with the class "moving-platform").
// Properties:
//   move-x, move-y  how far it moves from where it was placed, in pixels (default 0)
//   speed           pixels per second (default PLATFORM_SPEED in config.js)
//   width-tiles     how many tiles wide it is (default 1); the tile is repeated, not stretched
// It moves back and forth with velocity, so Phaser carries the player along when they ride it.
// It's one-way like the "platforms" layer: you can only land on its top.
export class MovingPlatform extends TileObject {
    constructor(scene, map, obj, player) {
        super(scene, map, obj);

        // Wider platforms: make the body N tiles wide and draw copies of the tile to its right
        const widthTiles = getProp(obj, 'width-tiles') ?? 1;
        this.body.setSize(this.width * widthTiles, this.height, false);
        this.body.setOffset(0, 0);
        this.extraTiles = [];
        for (let i = 1; i < widthTiles; i++) {
            const tile = scene.add.image(this.x + i * this.width, this.y, this.texture.key, this.frame.name);
            this.extraTiles.push(tile.setPipeline('PixelLight'));
        }

        // Only the top is solid (no sides, so wall slides can't grab it)
        this.body.checkCollision.left = false;
        this.body.checkCollision.right = false;
        this.body.checkCollision.down = false;

        // Path: from the start, toward (start + move-x/move-y), and back
        const moveX = getProp(obj, 'move-x') ?? 0;
        const moveY = getProp(obj, 'move-y') ?? 0;
        this.speed = getProp(obj, 'speed') ?? PLATFORM_SPEED;
        this.distance = Math.hypot(moveX, moveY);
        this.dirX = this.distance > 0 ? moveX / this.distance : 0;
        this.dirY = this.distance > 0 ? moveY / this.distance : 0;
        this.startX = this.x;
        this.startY = this.y;
        this.goingOut = true;
        this.setVelocity(this.dirX * this.speed, this.dirY * this.speed);

        scene.physics.add.collider(player, this, null,
            () => player.landsOn(this.body.y, this.body.velocity.y));
    }

    // Called by the level every frame
    update() {
        // How far along the path we are (0 = start, distance = end)
        const traveled = (this.x - this.startX) * this.dirX + (this.y - this.startY) * this.dirY;

        if (this.goingOut && traveled >= this.distance) {
            this.goingOut = false;
            this.setVelocity(-this.dirX * this.speed, -this.dirY * this.speed);
        } else if (!this.goingOut && traveled <= 0) {
            this.goingOut = true;
            this.setVelocity(this.dirX * this.speed, this.dirY * this.speed);
        }

        // Keep the extra tiles lined up with the body
        this.extraTiles.forEach((tile, i) => {
            tile.setPosition(this.body.x + (i + 1.5) * this.width, this.body.y + this.height / 2);
        });
    }
}
