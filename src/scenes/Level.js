// No Phaser import here: phaser.js is loaded by index.html and creates the global `Phaser`.
import { LightSystem } from '../systems/LightSystem.js';
import { Player } from '../objects/Player.js';
import { Torch, allTorchesLit } from '../objects/Torch.js';
import { Gem } from '../objects/Gem.js';
import { Key, revealAllKeys, allKeysCollected } from '../objects/Key.js';
import { Goal } from '../objects/Goal.js';
import { Spike } from '../objects/Spike.js';
import { MovingPlatform } from '../objects/MovingPlatform.js';
import { AMBIENT_COLOR, PLAYER_GLOW, PLAYER_PULSE, CAMERA_DEADZONE, SOUNDS } from '../config.js';
import { LEVELS } from '../levels.js';

// Base scene for every level. Subclasses (Level1, Level2...) just pass in their scene key
// and map name; they can override create()/update() to add their own mechanics.
//
// Run values (gems, lives: see run.js) live in the registry and carry over between levels.
// Level values (like the keys you're holding) live on the level and start over every
// time create() runs, since the objects are made fresh.
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
        this.load.image('smoke04', 'assets/particles/smoke_04.png');

        // sound effects (the list is SOUNDS in config.js)
        for (const name in SOUNDS) {
            this.load.audio(name, 'assets/audio/' + SOUNDS[name].file);
        }
    }

    create() {
        const map = this.createMap();
        this.createPlayer(map);
        this.createLights(map);
        this.createObjects(map);

        // Gems when this attempt started, put back if the player dies
        this.startGems = this.registry.get('gems');
        this.dead = false;

        // The HUD scene draws on top and reads values from the registry
        this.scene.launch('HUD');
        this.events.once('shutdown', () => this.scene.stop('HUD'));

        this.setupCamera(map);
        this.setupControls();
    }

    // Builds the tile layers. Returns the map so the other steps can read its objects.
    createMap() {
        const map = this.make.tilemap({ key: this.mapName });

        // tileset name in Tiled  ->  key we loaded in preload()
        const tilesets = [
            map.addTilesetImage('monochrome_tilemap_transparent_packed', 'tiles_transparent'),
            map.addTilesetImage('monochrome_tilemap_packed', 'tiles_solid'),
        ];

        // Layer names match Tiled exactly. Creation order = draw order (back to front).
        // setPipeline('PixelLight') makes a layer react to lights (our pixelated version of
        // Phaser's Light2D, registered in main.js). Anything WITHOUT it ignores the darkness
        // and draws at full brightness.
        map.createLayer('background', tilesets).setPipeline('PixelLight');
        this.ground = map.createLayer('ground', tilesets).setPipeline('PixelLight');
        map.createLayer('decoration', tilesets).setPipeline('PixelLight');

        // Every non-empty tile on the ground layer is solid.
        this.ground.setCollisionByExclusion([-1]);

        // One-way platforms (optional layer): only the top of each tile is solid
        this.platforms = null;
        if (map.getLayer('platforms')) {
            this.platforms = map.createLayer('platforms', tilesets).setPipeline('PixelLight');
            this.platforms.forEachTile(tile => {
                if (tile.index !== -1) tile.setCollision(false, false, true, false);
            });
        }

        this.tilesets = tilesets;   // createPlayer() needs these for the foreground layer
        return map;
    }

    // The player, at the spawn point placed in Tiled
    createPlayer(map) {
        const spawn = this.objectsOfClass(map, 'player')[0];
        this.player = new Player(this, spawn.x, spawn.y);
        this.physics.add.collider(this.player, this.ground);
        if (this.platforms) {
            this.physics.add.collider(this.player, this.platforms, null,
                (player, tile) => player.landsOn(tile.pixelY));
        }

        // Created after the player, so it draws in front of them.
        map.createLayer('foreground', this.tilesets).setPipeline('PixelLight');
    }

    // Darkness, the player's glow, the map's lights, and torches
    createLights(map) {
        this.lights.enable().setAmbientColor(AMBIENT_COLOR);
        this.playerGlow = this.lights.addLight(this.player.x, this.player.y,
            PLAYER_GLOW.radius, PLAYER_GLOW.color, PLAYER_GLOW.intensity);
        this.lightSystem = new LightSystem(this, map);   // "light" and "torch" objects

        // Objects with the class "torch" also become torches the player can light
        this.torches = this.lightSystem.lights
            .filter(l => l.obj.type === 'torch')
            .map(l => new Torch(this, l, this.player));
    }

    // Gems, keys, goals, spikes and moving platforms, found by their Tiled class
    createObjects(map) {
        const make = (cls, ObjectClass) => this.objectsOfClass(map, cls)
            .map(obj => new ObjectClass(this, map, obj, this.player));

        this.gems = make('gem', Gem);
        this.keyItems = make('key', Key);
        // A list, so a level could have more than one goal (alternate endings)
        this.goals = make('goal', Goal);
        this.spikes = make('spike', Spike);
        this.movingPlatforms = make('moving-platform', MovingPlatform);
        this.bouncePads = make('bouncePad', BouncePad);
    }

    // Every Tiled object with this class, on any object layer.
    // (Phaser puts Tiled's "Class" field in obj.type.)
    objectsOfClass(map, cls) {
        return map.objects
            .flatMap(layer => layer.objects)
            .filter(obj => obj.type === cls);
    }

    // The game renders at 320x180 (see main.js), the map is 320 wide, so it fills the
    // screen width exactly and we see 180px (about 11 tiles) of height. No zoom needed:
    // Scale.FIT stretches the whole canvas up to the window with chunky pixels.
    setupCamera(map) {
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.1, 1);
        // The camera only moves once the player leaves this box, so small hops don't move it.
        // (With a deadzone, Phaser ignores the 0.1, 1 lerp above.)
        this.cameras.main.setDeadzone(CAMERA_DEADZONE.width, CAMERA_DEADZONE.height);
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');
    }

    // Called by a Torch when the player lights it
    onTorchLit() {
        if (allTorchesLit(this.torches)) {
            revealAllKeys(this.keyItems);
        }
    }

    // Called by a Gem when the player picks it up
    addGems(amount) {
        this.registry.inc('gems', amount);   // the HUD updates itself from this
    }

    // Called by a Spike when it kills the player
    onPlayerDeath() {
        if (this.dead) return;   // only die once, even if two spikes hit at the same time
        this.dead = true;
        this.sound.play('death', { volume: SOUNDS.death.volume });

        this.registry.inc('lives', -1);
        if (this.registry.get('lives') <= 0) {
            this.scene.start('GameOver');
        } else {
            this.registry.set('gems', this.startGems);   // gems from this attempt don't count
            this.scene.restart();
        }
    }

    // Called by a Goal when the player touches it
    onGoalContact(goal) {
        if (allKeysCollected(this.keyItems)) {
            goal.disableBody(true, true); // prevent multiple triggers

            // Go to the next level in LEVELS, or the Win screen after the last one.
            // Stopping this level also stops the HUD; the next level relaunches it.
            const index = LEVELS.findIndex(level => level.key === this.scene.key);
            const next = LEVELS[index + 1];
            this.scene.start(next ? next.key : 'Win');
        } else {
            // TODO: indicate that the key needs to be collected first
            // maybe play a locked door sound?
        }
    }

    update(time) {
        // Lights: glow follows the player and gently breathes; level lights flicker/pulse
        const breath = Math.sin((time / 1000) * (Math.PI * 2 / PLAYER_PULSE.seconds));   // -1..1
        this.playerGlow.setPosition(this.player.x, this.player.y);
        this.playerGlow.radius = PLAYER_GLOW.radius * (1 + PLAYER_PULSE.radius * breath);
        this.playerGlow.intensity = PLAYER_GLOW.intensity * (1 + PLAYER_PULSE.bright * breath);
        this.lightSystem.update(time);

        this.movingPlatforms.forEach(p => p.update());
        this.player.update(time, this.cursors, this.keys);
    }
}
