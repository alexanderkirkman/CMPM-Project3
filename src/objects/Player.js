import { PLAYER_FRAME, MOVE_SPEED, JUMP_SPEED, AIR_JUMPS, AIR_JUMP_SPEED, COYOTE_TIME, PLAYER_ANIMS,
    WALL_SLIDE_SPEED, WALL_JUMP_X, WALL_JUMP_Y, WALL_JUMP_LOCK, DROP_TIME,
    SOUNDS, LAND_MIN_AIR_TIME, HARD_LANDING_SPEED, DUST_SCALE, DUST_HARD_SCALE } from '../config.js';
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
        this.wasOnGround = true;         // for spotting the moment we land
        this.leftGroundAt = 0;           // when we last left the ground
        this.fallSpeed = 0;              // how fast we were falling last frame

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

        // Landing: only after real air time, so small steps and moving platforms don't count
        const onGround = this.body.blocked.down;
        if (!onGround && this.wasOnGround) {
            this.leftGroundAt = time;
        }
        if (onGround && !this.wasOnGround && time - this.leftGroundAt > LAND_MIN_AIR_TIME) {
            const hard = this.fallSpeed >= HARD_LANDING_SPEED;
            this.scene.sound.play('land', { volume: SOUNDS.land.volume });
            this.dust(hard ? DUST_HARD_SCALE : DUST_SCALE);
        }
        this.wasOnGround = onGround;
        this.fallSpeed = this.body.velocity.y;

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
                this.scene.sound.play('jump', { volume: SOUNDS.jump.volume });
                this.dust(DUST_SCALE);
            } else if (wallLeft || wallRight) {
                // Wall jump: up and away from the wall, then lock left/right for a moment
                const away = wallLeft ? 1 : -1;
                this.setVelocity(away * WALL_JUMP_X, -WALL_JUMP_Y);
                this.wallJumpLockUntil = time + WALL_JUMP_LOCK;
                this.scene.sound.play('wallJump', { volume: SOUNDS.wallJump.volume });
                this.dust(DUST_SCALE);
            } else if (this.airJumpsLeft > 0) {
                this.setVelocityY(-AIR_JUMP_SPEED);    // double jump
                this.airJumpsLeft--;
            }
        }

        this.animController.update();
    }

    // Small puff of dust at our feet (jumping and landing). Lit by PixelLight like the torch smoke.
    dust(scale) {
        const puff = this.scene.add.particles(this.x, this.body.bottom, 'smoke04', {
            emitting: false,                     // only fires once, from explode() below
            speed: { min: 10, max: 30 },
            angle: { min: 200, max: 340 },       // up and out to both sides
            scale: { start: scale, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: { min: 200, max: 300 },
        });
        puff.setPipeline('PixelLight');
        puff.explode(6);
        puff.once('complete', () => puff.destroy());   // remove it once every puff is gone
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
