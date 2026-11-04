// No Phaser import here: phaser.js is loaded by index.html and creates the global `Phaser`.
import { LightSystem } from '../systems/LightSystem.js';

// Which tile in the tilesheet to use as the player.
// In Tiled, click the character tile in the Tilesets panel; the "ID" shown in the
// Properties panel is this number (for the first tileset, ID = frame index).
const PLAYER_FRAME = 240;

const MOVE_SPEED = 100;   // pixels per second, left/right
const JUMP_SPEED = 360;   // initial upward speed when jumping
const AIR_JUMPS = 1;               // extra jumps allowed in mid-air (1 = double jump, 2 = triple...)
const AIR_JUMP_SPEED = 300;        // mid-air jumps are a bit weaker than the first jump
const COYOTE_TIME = 100;    // Time in milliseconds to allow player jump without expending air jump

// Lighting tuning
const AMBIENT_COLOR = 0x101018;   // how dark the level is where no light reaches (0x000000 = pitch black)
// Player light. A cool color contrasts nicely with the warm amber torches.
// Other nice options: 0xb79cff (soft lavender), 0x7fffd4 (aquamarine), 0xffd9a0 (warm candle)
const PLAYER_GLOW = { radius: 40, color: 0xffd9a0, intensity: 0.75 };   // soft sky blue
const PLAYER_PULSE = {
    seconds: 3,      // one slow "breath" (grow + shrink)
    radius: 0.08,    // radius grows/shrinks by +/-8%
    bright: 0.15,    // brightness goes up/down by +/-15%
};

export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        // Loading the sheets as spritesheets (cut into 16x16 frames) lets us use a single
        // tile as a sprite (the player), and the tilemap can still use them too.
        this.load.spritesheet('tiles_transparent', 'assets/images/monochrome_tilemap_transparent_packed.png',
            { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('tiles_solid', 'assets/images/monochrome_tilemap_packed.png',
            { frameWidth: 16, frameHeight: 16 });

        this.load.tilemapTiledJSON('level1', 'assets/maps/level1.json');
    }

    create() {
        // ---- 1. Build the map ----
        const map = this.make.tilemap({ key: 'level1' });

        // tileset name in Tiled  ->  key we loaded above
        const tilesets = [
            map.addTilesetImage('monochrome_tilemap_transparent_packed', 'tiles_transparent'),
            map.addTilesetImage('monochrome_tilemap_packed', 'tiles_solid'),
        ];

        // Layer names match Tiled exactly. Creation order = draw order (back to front).
        // setPipeline('PixelLight') makes a layer react to lights (our pixelated version of
        // Phaser's Light2D, registered in main.js). Anything WITHOUT it ignores the darkness
        // and draws at full brightness.
        map.createLayer('background', tilesets).setPipeline('PixelLight');
        const ground = map.createLayer('ground', tilesets).setPipeline('PixelLight');
        map.createLayer('decoration', tilesets).setPipeline('PixelLight');

        // Every non-empty tile on the ground layer is solid.
        ground.setCollisionByExclusion([-1]);

        // ---- 2. Player, at the spawn point you placed in Tiled ----
        const spawn = map.findObject('spawns', obj => obj.name === 'player');
        this.player = this.physics.add.sprite(spawn.x, spawn.y, 'tiles_transparent', PLAYER_FRAME);
        this.player.setCollideWorldBounds(true);
        this.player.setPipeline('PixelLight');

        this.physics.add.collider(this.player, ground);

        // Created after the player, so it draws in front of them.
        map.createLayer('foreground', tilesets).setPipeline('PixelLight');

        // ---- Lighting ----
        this.lights.enable().setAmbientColor(AMBIENT_COLOR);
        this.playerGlow = this.lights.addLight(spawn.x, spawn.y,
            PLAYER_GLOW.radius, PLAYER_GLOW.color, PLAYER_GLOW.intensity);
        this.lightSystem = new LightSystem(this, map);   // reads the 'lights' layer

        // ---- 3. World + camera ----
        // The game renders at 320x180 (see main.js), the map is 320 wide, so it fills the
        // screen width exactly and we see 180px (about 11 tiles) of height. No zoom needed:
        // Scale.FIT stretches the whole canvas up to the window with chunky pixels.
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1); // 0.1 = smooth follow

        // ---- 4. Controls ----
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,D,SPACE');

        this.airJumpsLeft = AIR_JUMPS;   // refilled every time we land
        this.player.lastGrounded = 0;  // last recorded time player was on the ground (for coyote time)
        this.player.grounded = true;    // player is on the ground or was on the ground within coyote time window
    }

    update(time) {
        // Lights: glow follows the player and gently breathes; level lights flicker/pulse
        const breath = Math.sin((time / 1000) * (Math.PI * 2 / PLAYER_PULSE.seconds));   // -1..1
        this.playerGlow.setPosition(this.player.x, this.player.y);
        this.playerGlow.radius = PLAYER_GLOW.radius * (1 + PLAYER_PULSE.radius * breath);
        this.playerGlow.intensity = PLAYER_GLOW.intensity * (1 + PLAYER_PULSE.bright * breath);
        this.lightSystem.update(time);

        const left  = this.cursors.left.isDown  || this.keys.A.isDown;
        const right = this.cursors.right.isDown || this.keys.D.isDown;
        const jump  = Phaser.Input.Keyboard.JustDown(this.cursors.up)
                   || Phaser.Input.Keyboard.JustDown(this.keys.W)
                   || Phaser.Input.Keyboard.JustDown(this.keys.SPACE);

        // Left / right
        if (left) {
            this.player.setVelocityX(-MOVE_SPEED);
            this.player.setFlipX(true);
        } else if (right) {
            this.player.setVelocityX(MOVE_SPEED);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        // Jumping
        const onGround = this.player.body.blocked.down;
        if (onGround) {
            this.airJumpsLeft = AIR_JUMPS;            // landed: refill air jumps
            this.player.lastGrounded = time;
            this.player.grounded = true;
        } else if (this.player.lastGrounded + COYOTE_TIME < time) {
            this.player.grounded = false;
        }

        if (jump) {
            if (this.player.grounded) {
                this.player.setVelocityY(-JUMP_SPEED);           // normal jump
                this.player.grounded = false;
            } else if (this.airJumpsLeft > 0) {
                this.player.setVelocityY(-AIR_JUMP_SPEED);       // double jump
                this.airJumpsLeft--;
            }
        }
    }
}