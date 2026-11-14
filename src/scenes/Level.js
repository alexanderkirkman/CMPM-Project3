// No Phaser import here: phaser.js is loaded by index.html and creates the global `Phaser`.
import { LightSystem } from '../systems/LightSystem.js';
import { Player } from '../objects/Player.js';
import { Torch, allTorchesLit } from '../objects/Torch.js';
import { Gem } from '../objects/Gem.js';
import { AMBIENT_COLOR, PLAYER_GLOW, PLAYER_PULSE, GEM_FRAME } from '../config.js';

// Base scene for every level. Subclasses (Level1, Level2...) just pass in their scene key
// and map name; they can override create()/update() to add their own mechanics.
export class Level extends Phaser.Scene {
    // mapName is the file in assets/maps without ".json", and is also the map's cache key
    constructor(key, mapName) {
        super(key);
        this.mapName = mapName;
    }

    preload() {
        // Loading the sheets as spritesheets (cut into 16x16 frames) lets us use a single
        // tile as a sprite (the player), and the tilemap can still use them too.
        this.load.spritesheet('tiles_transparent', 'assets/images/monochrome_tilemap_transparent_packed.png',
            { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('tiles_solid', 'assets/images/monochrome_tilemap_packed.png',
            { frameWidth: 16, frameHeight: 16 });

        this.load.tilemapTiledJSON(this.mapName, `assets/maps/${this.mapName}.json`);

        // particles
        this.load.image('smoke10', 'assets/particles/smoke_10.png');
        this.load.image('star04', 'assets/particles/star_04.png');
    }

    create() {
        // ---- 1. Build the map ----
        const map = this.make.tilemap({ key: this.mapName });

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
        this.player = new Player(this, spawn.x, spawn.y);
        this.physics.add.collider(this.player, ground);

        // Created after the player, so it draws in front of them.
        map.createLayer('foreground', tilesets).setPipeline('PixelLight');

        // ---- 3. Lighting ----
        this.lights.enable().setAmbientColor(AMBIENT_COLOR);
        this.playerGlow = this.lights.addLight(spawn.x, spawn.y,
            PLAYER_GLOW.radius, PLAYER_GLOW.color, PLAYER_GLOW.intensity);
        this.lightSystem = new LightSystem(this, map);   // reads the 'lights' layer

        // Lights named "torch" in Tiled become torches the player can light
        this.torches = this.lightSystem.lights
            .filter(l => l.obj.name === 'torch')
            .map(l => new Torch(this, l, this.player));

        // ---- Gems (objects named "gem" on the 'triggers' layer) ----
        const triggers = map.getObjectLayer('triggers')?.objects ?? [];
        this.gems = triggers
            .filter(obj => obj.name === 'gem')
            .map(obj => new Gem(this, map, obj, this.player));

        this.gemCount = 0;
        // Gem counter: icon + "x 0" in the top-left corner, both centered on the same y.
        // Fixed to the camera, no PixelLight so it stays readable in the dark.
        const hudY = 10;
        this.gemIcon = this.add.image(4, hudY, 'tiles_transparent', GEM_FRAME)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(100);
        makePixelFont(this);
        // The gem tile has 4px of empty space on its right, which is the gap before the "x"
        const textX = this.gemIcon.x + this.gemIcon.width;
        this.gemText = this.add.bitmapText(textX, hudY, 'pixelFont', 'x 0')
            .setScale(2)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(100);

        // ---- 4. World + camera ----
        // The game renders at 320x180 (see main.js), the map is 320 wide, so it fills the
        // screen width exactly and we see 180px (about 11 tiles) of height. No zoom needed:
        // Scale.FIT stretches the whole canvas up to the window with chunky pixels.
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1); // 0.1 = smooth follow

        // ---- 5. Controls ----
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,D,SPACE');
    }

    // Called by a Torch when the player lights it
    onTorchLit() {
        if (allTorchesLit(this.torches)) {
            // TODO: reveal key
        }
    }

    // Called by a Gem when the player picks it up
    addGems(amount) {
        this.gemCount += amount;
        this.gemText.setText('x ' + this.gemCount);
    }

    update(time) {
        // Lights: glow follows the player and gently breathes; level lights flicker/pulse
        const breath = Math.sin((time / 1000) * (Math.PI * 2 / PLAYER_PULSE.seconds));   // -1..1
        this.playerGlow.setPosition(this.player.x, this.player.y);
        this.playerGlow.radius = PLAYER_GLOW.radius * (1 + PLAYER_PULSE.radius * breath);
        this.playerGlow.intensity = PLAYER_GLOW.intensity * (1 + PLAYER_PULSE.bright * breath);
        this.lightSystem.update(time);

        this.player.update(time, this.cursors, this.keys);
    }
}

// Tiny 3x5 pixel font for the gem count. Normal Phaser text is blurry at this size,
// so we draw the characters ourselves and turn them into a bitmap font.
const FONT_CHARS = '0123456789x ';
const FONT_GLYPHS = [
    ['###', '#.#', '#.#', '#.#', '###'],   // 0
    ['.#.', '##.', '.#.', '.#.', '###'],   // 1
    ['###', '..#', '###', '#..', '###'],   // 2
    ['###', '..#', '###', '..#', '###'],   // 3
    ['#.#', '#.#', '###', '..#', '..#'],   // 4
    ['###', '#..', '###', '..#', '###'],   // 5
    ['###', '#..', '###', '#.#', '###'],   // 6
    ['###', '..#', '..#', '..#', '..#'],   // 7
    ['###', '#.#', '###', '#.#', '###'],   // 8
    ['###', '#.#', '###', '..#', '###'],   // 9
    ['...', '#.#', '.#.', '#.#', '...'],   // x
    ['...', '...', '...', '...', '...'],   // space
];

function makePixelFont(scene) {
    if (scene.cache.bitmapFont.exists('pixelFont')) return;   // already made by an earlier level

    // One row of characters, each 3px wide plus 1px gap. '2' is white in Phaser's palette.
    const rows = [];
    for (let r = 0; r < 5; r++) {
        rows.push(FONT_GLYPHS.map(g => g[r] + '.').join('').replaceAll('#', '2'));
    }
    scene.textures.generate('pixelFont', { data: rows, pixelWidth: 1 });

    const font = Phaser.GameObjects.RetroFont.Parse(scene, {
        image: 'pixelFont', width: 4, height: 5, chars: FONT_CHARS, charsPerRow: FONT_CHARS.length,
    });
    // Narrow space: with the 1px gap after "x", "x 3" gets a 2px gap (4px at 2x scale)
    font.data.chars[32].xAdvance = 1;
    scene.cache.bitmapFont.add('pixelFont', font);
}
