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

You get one extra jump in the air (double jump). It refills when you land.

## Folder layout

```
index.html                  loads phaser.js and src/main.js
phaser.js                   Phaser 3.90.0
src/main.js                 game config (size, physics, registers the light shader)
src/scenes/Start.js         the only scene right now: loads the map, player, camera, controls
src/systems/LightSystem.js  turns objects on the "lights" layer into lights
src/pipelines/PixelLightPipeline.js   the pixel-art lighting shader
assets/images/              the two tilesheets (16x16 tiles)
assets/maps/level1.tmx      the Tiled file you edit
assets/maps/level1.json     the export the game actually loads
```

## Editing levels in Tiled

Open `assets/maps/level1.tmx` in Tiled and edit that. The game never reads the .tmx, only `level1.json`, so after every change do File > Export As and overwrite `level1.json` (the export target is already saved in the .tmx, so Ctrl+E / Cmd+E should go straight there). If your edits don't show up in the game, you probably forgot to export.

A few rules:

- Tilesets have to be embedded in the map, not saved as separate .tsx files. Phaser can't load external tilesets. Both of ours are embedded already.
- Layer names are case-sensitive and have to match what `Start.js` asks for. Renaming `ground` to `Ground` will break the game.
- Tileset names in Tiled (`monochrome_tilemap_transparent_packed` and `monochrome_tilemap_packed`) also have to match the names in `Start.js`.

The map is 20x45 tiles at 16px, so 320x720 pixels.

Layers, in draw order:

- `background`: tiles behind everything.
- `ground`: the solid stuff. Every non-empty tile here gets collision.
- `decoration`: non-solid detail, drawn behind the player.
- `foreground`: drawn in front of the player.
- `triggers` (object layer): has a goal, a key, and two gems placed, but the code doesn't read this layer yet. These objects don't show up in game at all right now.
- `lights` (object layer): every light source in the level. See below.
- `spawns` (object layer): a point named `player` where the player starts. The game crashes without it.

## Adding lights

Put an object on the `lights` layer and set its Class to `light`. Objects with any other class get ignored.

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

- `src/scenes/Start.js`: movement and jump speeds, how many air jumps, ambient darkness, the player's glow.
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

Code is MIT licensed, see `LICENSE`.
