import { PLAYER_FRAME, MOVE_SPEED, JUMP_SPEED, AIR_JUMPS, AIR_JUMP_SPEED, COYOTE_TIME } from '../config.js';

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
    }

    // Called by the level every frame with its keyboard keys
    update(time, cursors, keys) {
        const left  = cursors.left.isDown  || keys.A.isDown;
        const right = cursors.right.isDown || keys.D.isDown;
        const jump  = Phaser.Input.Keyboard.JustDown(cursors.up)
                   || Phaser.Input.Keyboard.JustDown(keys.W)
                   || Phaser.Input.Keyboard.JustDown(keys.SPACE);

        // Left / right
        if (left) {
            this.setVelocityX(-MOVE_SPEED);
            this.setFlipX(true);
        } else if (right) {
            this.setVelocityX(MOVE_SPEED);
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
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
            } else if (this.airJumpsLeft > 0) {
                this.setVelocityY(-AIR_JUMP_SPEED);    // double jump
                this.airJumpsLeft--;
            }
        }
    }
}
