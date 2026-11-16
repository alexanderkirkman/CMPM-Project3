import { PLAYER_FRAME, MOVE_SPEED, JUMP_SPEED, AIR_JUMPS, AIR_JUMP_SPEED, COYOTE_TIME, PLAYER_ANIMS,
    WALL_SLIDE_SPEED, WALL_JUMP_X, WALL_JUMP_Y, WALL_JUMP_LOCK, DROP_TIME } from '../config.js';
import { createAnims, AnimationController } from '../systems/Animations.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'tiles_transparent', PLAYER_FRAME);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setPipeline('PixelLight');

        this.airJumpsLeft = AIR_JUMPS;   // refilled every time we land
        this.lastGrounded = 0;           // last time we were on the ground (for coyote time)
        this.grounded = true;            // on the ground, or left it less than COYOTE_TIME ago
        this.wallJumpLockUntil = 0;      // left/right input is ignored until this time
        this.dropUntil = 0;              // falling through one-way platforms until this time
        this.dropping = false;

        createAnims(scene, 'player', PLAYER_ANIMS);
        this.animController = new AnimationController(this, 'player');   // also handles facing left/right
    }

    // Called by the level every frame with its keyboard keys
    update(time, cursors, keys) {
        const left  = cursors.left.isDown  || keys.A.isDown;
        const right = cursors.right.isDown || keys.D.isDown;
        const jump  = Phaser.Input.Keyboard.JustDown(cursors.up)
                   || Phaser.Input.Keyboard.JustDown(keys.W)
                   || Phaser.Input.Keyboard.JustDown(keys.SPACE);
        const down  = cursors.down.isDown || keys.S.isDown;

        // Holding down while standing starts a short drop through one-way platforms
        if (down && this.body.blocked.down) {
            this.dropUntil = time + DROP_TIME;
        }
        this.dropping = time < this.dropUntil;

        // Touching a wall while in the air
        const wallLeft  = this.body.blocked.left  && !this.body.blocked.down;
        const wallRight = this.body.blocked.right && !this.body.blocked.down;

        // Left / right (skipped right after a wall jump, so the push away isn't cancelled)
        if (time > this.wallJumpLockUntil) {
            if (left) {
                this.setVelocityX(-MOVE_SPEED);
            } else if (right) {
                this.setVelocityX(MOVE_SPEED);
            } else {
                this.setVelocityX(0);
            }
        }

        // Wall slide: holding into a wall caps the fall speed
        if ((wallLeft && left) || (wallRight && right)) {
            if (this.body.velocity.y > WALL_SLIDE_SPEED) {
                this.setVelocityY(WALL_SLIDE_SPEED);
            }
        }

        // Ground check + coyote time
        if (this.body.blocked.down) {
            this.airJumpsLeft = AIR_JUMPS;   // landed: refill air jumps
            this.lastGrounded = time;
            this.grounded = true;
        } else if (this.lastGrounded + COYOTE_TIME < time) {
            this.grounded = false;
        }

        // Jumping
        if (jump) {
            if (this.grounded) {
                this.setVelocityY(-JUMP_SPEED);        // normal jump
                this.grounded = false;
            } else if (wallLeft || wallRight) {
                // Wall jump: up and away from the wall, then lock left/right for a moment
                const away = wallLeft ? 1 : -1;
                this.setVelocity(away * WALL_JUMP_X, -WALL_JUMP_Y);
                this.wallJumpLockUntil = time + WALL_JUMP_LOCK;
            } else if (this.airJumpsLeft > 0) {
                this.setVelocityY(-AIR_JUMP_SPEED);    // double jump
                this.airJumpsLeft--;
            }
        }

        this.animController.update();
    }

    // One-way platform rule, used by the "platforms" layer and by moving platforms.
    // Only land if we're falling (compared to the platform), our feet were above its top
    // last step, and we're not dropping through. top = the platform's top edge,
    // platformVy = how fast the platform moves up/down (0 for the platforms layer).
    landsOn(top, platformVy = 0) {
        const falling = this.body.velocity.y >= platformVy;
        // 4px of leeway, since a platform moving up gets a little ahead of our feet each step
        const feetWereAbove = this.body.prev.y + this.body.height <= top + 4;
        return falling && feetWereAbove && !this.dropping;
    }
}
