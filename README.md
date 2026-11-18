# Shadow's Bane

A vertical 2D platformer made with Phaser 3.90. You climb a dark tower where the only light comes from torches, glowing plants, and a small glow around the player. Levels are built in Tiled.

## Running it

There's no build step and nothing to install. Phaser is already in the repo as `phaser.js`.

You do need a local server, though. If you just double-click `index.html` the browser blocks the map file from loading and you get a black screen.

- **VS Code:** install the Live Server extension, right-click `index.html`, pick "Open with Live Server".
- **Command line:** from the repo root run `python3 -m http.server 8000`, then open http://localhost:8000.

## Controls

| Action | Keys |
| --- | --- |
| Move | Left/Right arrows or A/D |
| Jump | Up arrow, W, or Space |
| Wall jump | Jump while touching a wall in the air |
| Drop through a platform | Down arrow or S while standing on it |

Hold toward a wall in the air to slide down it slowly, and press jump while on a wall to jump up and away from it.

## Folder layout

```
index.html                  loads phaser.js and src/main.js
phaser.js                   Phaser 3.90.0
src/main.js                 game config (size, physics, registers the light shader)
src/config.js               tuning numbers: tile frames, player movement, platforms, sounds, animations, camera, lighting
src/levels.js               list of levels; the menu and Level.js both read it
src/run.js                  values that carry over between levels (gems, lives) and newRun()
src/scenes/Menu.js          level select menu; picking a level starts a new run
src/scenes/Level.js         base level scene: loads the map, player, lights, objects, camera, controls
src/scenes/Level1.js        level 1 (just picks its map; add level-specific stuff here)
src/scenes/Level2.js        level 2
src/scenes/HUD.js           gem and lives counters drawn on top of the level
src/scenes/Win.js           shown after the last level, with the gem total
src/scenes/GameOver.js      shown when you run out of lives
src/objects/TileObject.js   base class for Tiled tile objects, plus tileInfo() and getProp()
src/objects/Player.js       the player: movement, jump, coyote time, wall slide, wall jump, drop-through, landing dust
src/objects/Torch.js        torches: light up on touch, smoke puff, allTorchesLit()
src/objects/Gem.js          gems: collect on touch, star burst, adds to the gem count
src/objects/Key.js          keys: hidden until every torch is lit, then collectable
src/objects/Goal.js         goal: with the key, goes to the next level (or Win)
src/objects/Spike.js        spikes; danger-x/danger-y pick which sides kill
src/objects/MovingPlatform.js   one-way platforms that move back and forth
src/objects/BouncePad.js    bouncePads: bounceForce determines the velocity of the bounce (Unique mechanic for Level 2) 
src/systems/LightSystem.js  turns "light" and "torch" objects into lights
src/systems/Animations.js   creates the player animations and picks idle/run/jump/fall
src/ui/Counter.js           icon + "x N" counter used by the HUD
src/ui/pixelFont.js         tiny pixel font for the HUD numbers
src/pipelines/PixelLightPipeline.js   the pixel-art lighting shader
assets/images/              the two tilesheets (16x16 tiles)
assets/particles/           particle images in use (copied from kenney_particle-pack)
assets/audio/               sound effects in use (copied from the kenney audio packs)
assets/maps/levelN.tmx      the Tiled files you edit
assets/maps/levelN.json     the exports the game actually loads
assets/kenney_particle-pack/    full particle pack, kept as a library to pick from
assets/kenney_impact-sounds/    full audio pack, kept as a library to pick from
assets/kenney_digital-audio/    full audio pack, kept as a library to pick from
assets/kenney_sci-fi-sounds/    full audio pack, kept as a library to pick from
```

The game only loads files from `assets/audio/` and `assets/particles/`. The Kenney packs stay untouched (with their license files) so you can pick new files from them later.

To add or swap a sound: copy an .ogg from one of the audio packs into `assets/audio/` and give it a short name (like `door.ogg`). Then add or change its line in `SOUNDS` in `src/config.js`, for example `door: { file: 'door.ogg', volume: 0.5 },`. Every sound in `SOUNDS` is loaded automatically, and you play it with `this.scene.sound.play('door', { volume: SOUNDS.door.volume })`.

To add or swap a particle image: copy a .png from `kenney_particle-pack/PNG (Transparent)/` into `assets/particles/`. Then add or change its `this.load.image(...)` line in `preload()` in `src/scenes/Level.js`, and use that key in `add.particles(...)`. The images are 512px, so particles need a small scale (around 0.02 to 0.08).

To add a level: make its map, `assets/maps/levelN.json`. Levels 1 to 10 are already on the menu. Only add a `LevelN.js` class if the level needs its own code (copy `Level2.js`, change the names, and add the class to `levelClasses` in `src/main.js`).

## Editing levels in Tiled

Open `assets/maps/level1.tmx` in Tiled and edit that. The game never reads the .tmx, only `level1.json`, so after every change do File > Export As and overwrite `level1.json` (the export target is already saved in the .tmx, so Ctrl+E / Cmd+E should go straight there). If your edits don't show up in the game, you probably forgot to export.

A few rules:

- Tilesets have to be embedded in the map, not saved as separate .tsx files. Phaser can't load external tilesets. Both of ours are embedded already.
- Layer names are case-sensitive and have to match what `Level.js` asks for. Renaming `ground` to `Ground` will break the game.
- Tileset names in Tiled (`monochrome_tilemap_transparent_packed` and `monochrome_tilemap_packed`) also have to match the names in `Level.js`.

The map is 20x45 tiles at 16px, so 320x720 pixels.

Layers, in draw order:

- `background`: tiles behind everything.
- `ground`: the solid stuff. Every non-empty tile here gets collision.
- `decoration`: non-solid detail, drawn behind the player.
- `platforms` (optional): one-way platforms. You can jump up through them and land on top, and pressing Down while standing on one drops you through.
- `foreground`: drawn in front of the player.
- `triggers` (object layer): the goal, key, and gems. The code finds objects by their Class (`gem`, `key`, `goal`, `spike`, `moving-platform`, `torch`...) on any object layer, so layer names are just for keeping the map organized.
- `lights` (object layer): every light source in the level. See below.
- `spawns` (object layer): a point with the Class `player` where the player starts. The game crashes without it.

Moving platforms are tile objects with the Class `moving-platform`. Their custom properties are `move-x` and `move-y` (how far they move from where they were placed, in pixels), `speed` (pixels per second, default `PLATFORM_SPEED` in config.js) and `width-tiles` (how many tiles wide, default 1). They're one-way like the `platforms` layer.

## Adding lights

Put an object on any object layer (the `lights` layer keeps things tidy) and set its Class to `light` for a plain light, or `torch` for a light the player lights by touching it. Objects with any other class don't make a light.

There are two ways to place one:

- **Tile object** (Insert Tile, T). The tile is drawn as a sprite and also gives off light. This is what the torches use.
- **Point object** (Insert Point, I). Light only, no sprite. Use this when the thing that should glow is already painted on a tile layer. A rectangle works too, the light goes at its center.

Custom properties, all optional:

- `color` (color): default `#FF8C32`, a warm amber.
- `radius` (int): in pixels, default 80.
- `intensity` (float): default 1.0.
- `effect` (string): `flicker` (fire, the default), `pulse` (slow glow, for plants), or `none` (steady).
- `speed` (float): speeds up or slows down the effect, default 1.0. Each light also gets a small random speed offset so they don't all move in sync.

Easiest thing is to copy an existing torch or plant and change it.

### The rule that trips everyone up

Anything that should be affected by lighting needs `.setPipeline('PixelLight')`. Without it, the object ignores the darkness and draws at full brightness. All the tile layers, the player, and the light sprites already have it. If you add a new sprite, layer, enemy, pickup, whatever, and it's glowing like it's daytime, this is why.

## Tuning

Constants are at the top of each file with comments:

- `src/config.js`: movement and jump speeds, how many air jumps, coyote time, wall slide and wall jump, drop-through time, platform speed, sound files and volumes, landing dust, ambient darkness, the player's glow.
- `src/systems/LightSystem.js`: how the flicker and pulse effects behave.
- `src/pipelines/PixelLightPipeline.js`: how the light looks (number of brightness steps, dithering, falloff, the white-hot center).
- `src/main.js`: game resolution, gravity, `maxLights`.

## Troubleshooting

- **Black screen.** Make sure you're on a local server and not `file://`. Then open the browser console. A missing or renamed layer, a missing `player` spawn, or a non-embedded tileset will all throw an error there.
- **Map changes not showing up.** Export to `level1.json` again, then hard refresh (browsers like to cache the json).
- **Something is too bright.** Either it's missing `setPipeline('PixelLight')`, or a bunch of lights overlap. Light adds up, so several lights close together will wash out. Lower `intensity` or `radius` on them.
- **Lights popping on and off while scrolling.** `maxLights` in `main.js` is 64. That's the cap on lights visible at once (counting the player's glow). If an area goes over it, some lights get dropped. Spread them out or raise the cap.
- **Camera not scrolling.** The game renders at 320x180 in `main.js`, and the map is 320x720, so the camera only scrolls vertically. If you bump the game size up to the map's height or more, there's nothing left to scroll.

## Credits

- [Phaser](https://phaser.io) 3.90.0
- [Tiled](https://www.mapeditor.org) for level editing
- Tiles from Kenney's [1-Bit Platformer Pack](https://kenney.nl/assets/1-bit-platformer-pack) (CC0)
- Particles from Kenney's [Particle Pack](https://kenney.nl/assets/particle-pack) (CC0)
- Sounds from Kenney's [Impact Sounds](https://kenney.nl/assets/impact-sounds), [Digital Audio](https://kenney.nl/assets/digital-audio) and [Sci-Fi Sounds](https://kenney.nl/assets/sci-fi-sounds) (CC0)

Code is MIT licensed, see `LICENSE`.
