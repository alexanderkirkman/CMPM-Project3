// Helpers for animating sprites (player, enemies) with Phaser's built-in animations.
// Animation keys are "<prefix>-<name>", like "player-run".

// Registers every animation in animData (see PLAYER_ANIMS in config.js).
// Animations are global to the game, so ones that already exist are skipped
// (levels restart and would otherwise try to create them again).
export function createAnims(scene, prefix, animData, texture = 'tiles_transparent') {
    for (const [name, data] of Object.entries(animData)) {
        const key = prefix + '-' + name;
        if (scene.anims.exists(key)) continue;

        scene.anims.create({
            key,
            frames: scene.anims.generateFrameNumbers(texture, { frames: data.frames }),
            frameRate: data.frameRate,
            repeat: data.repeat ? -1 : 0,
        });
    }
}

// Picks idle / run / jump / fall from the sprite's physics body and plays it.
// The sprite owns one of these and calls update() at the end of its own update().
export class AnimationController {
    constructor(sprite, prefix) {
        this.sprite = sprite;
        this.prefix = prefix;
    }

    update() {
        const body = this.sprite.body;

        // Face the way we're moving (keep the last direction when stopped)
        if (body.velocity.x < 0) {
            this.sprite.setFlipX(true);
        } else if (body.velocity.x > 0) {
            this.sprite.setFlipX(false);
        }

        let state;
        if (body.blocked.down) {
            state = body.velocity.x !== 0 ? 'run' : 'idle';
        } else {
            state = body.velocity.y < 0 ? 'jump' : 'fall';
        }

        // true = ignoreIfPlaying, so it only restarts when the state actually changes
        this.sprite.play(this.prefix + '-' + state, true);
    }
}
