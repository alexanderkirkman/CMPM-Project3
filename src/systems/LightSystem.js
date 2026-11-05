// LightSystem: builds every light in a Tiled object layer (default: 'lights').
// Any object whose Class is "light" becomes a light source.
//
// Object kinds you can place in Tiled:
//   - Tile object (Insert Tile, T): shows that tile as a sprite AND emits light. Good for torches.
//   - Point object (Insert Point, I): light only, no sprite. Good for lighting something that's
//     already painted on a tile layer, like a plant on the decoration layer.
//   - Rectangle: light only, placed at the rectangle's center.
//
// Custom properties (all optional):
//   color     (color)   light color                       -> default warm amber #FF8C32
//   radius    (int)     light radius in pixels            -> default 80 (5 tiles)
//   intensity (float)   brightness                        -> default 1.0
//   effect    (string)  "flicker" = fire                  -> default "flicker"
//                       "pulse"   = slow smooth glow (plants, crystals, magic)
//                       "none"    = steady light
//   speed     (float)   speed multiplier for the effect   -> default 1.0 (2 = twice as fast)
//
// Requires: scene.lights.enable() has been called (see Start.js).

// ---- Flicker ("fire") tuning ----
const FLICKER_SPEED = 2.5;    // how fast the flame changes (higher = more frantic)
const FLICKER_BRIGHT = 0.18;  // brightness wobble (0.18 = +/-18%)
const FLICKER_RADIUS = 0.07;  // radius wobble
const FLICKER_DRIFT = 0.8;    // how far (pixels) the light source dances around

// ---- Pulse ("plant") tuning ----
const PULSE_SECONDS = 3.5;    // one slow breath
const PULSE_BRIGHT = 0.25;    // brightness swell (+/-25%)
const PULSE_RADIUS = 0.10;    // radius swell (+/-10%)

// Every light gets its own random speed within +/- this much, so nothing syncs up
const SPEED_VARIATION = 0.4;

export class LightSystem {
    constructor(scene, map, options = {}) {
        this.scene = scene;
        this.lights = [];

        const layer = map.getObjectLayer(options.layerName ?? 'lights');
        for (const obj of layer?.objects ?? []) {
            // Tiled's "Class" field is exported as "type" (older Tiled versions call it "class")
            const objClass = obj.type || obj.class;
            if (objClass === 'light') {
                this.lights.push(this.createLight(map, obj));
            }
        }
    }

    createLight(map, obj) {
        let x, y, sprite = null;

        if (obj.gid) {
            // Tile object: draw the tile as a sprite.
            // Find which tileset the gid belongs to, to get the right spritesheet + frame.
            const tileset = map.tilesets.find(ts => ts.containsTileIndex(obj.gid));
            const frame = obj.gid - tileset.firstgid;
            // Tiled positions tile objects by their BOTTOM-left corner; Phaser sprites by center.
            x = obj.x + obj.width / 2;
            y = obj.y - obj.height / 2;
            sprite = this.scene.add.sprite(x, y, tileset.image.key, frame);
            if (obj.name == "torch") {
                this.scene.physics.add.existing(sprite);    // add to physics so overlap w/ player can be tracked
                // prevent torches from being affected by gravity
                sprite.body.immovable = true;
                sprite.body.maxVelocity.x = 0;
                sprite.body.maxVelocity.y = 0;

                sprite.setData({active: getProp(obj, 'active')}); // set active bool equal to default from Tiled
                this.scene.torchGroup.add(sprite);
            }
            sprite.setPipeline('PixelLight');
        } else {
            // Point (width/height 0) or rectangle: use its center, no sprite.
            x = obj.x + (obj.width ?? 0) / 2;
            y = obj.y + (obj.height ?? 0) / 2;
        }

        const color = parseTiledColor(getProp(obj, 'color')) ?? 0xff8c32;
        const radius = getProp(obj, 'radius') ?? 80;
        const intensity = getProp(obj, 'intensity') ?? 1.0;
        const effect = getProp(obj, 'effect') ?? 'flicker';
        const speedProp = getProp(obj, 'speed') ?? 1.0;

        return {
            sprite,
            effect,
            baseX: x,
            baseY: y,
            baseRadius: radius,
            baseIntensity: intensity,
            // per-light randomness so no two lights move alike
            seed: Math.random() * 1000,
            speed: speedProp * Phaser.Math.FloatBetween(1 - SPEED_VARIATION, 1 + SPEED_VARIATION),
            light: this.scene.lights.addLight(x, y, radius, color, intensity),
        };
    }

    // Call every frame from the scene's update()
    update(time) {
        const seconds = time / 1000;
        for (const l of this.lights) {
            if (l.effect === 'flicker') {
                this.updateFlicker(l, seconds);
            } else if (l.effect === 'pulse') {
                this.updatePulse(l, seconds);
            }
            // 'none' (or anything else): leave it steady

            // handle inactive torches
            if (l.sprite.data?.values?.active == false) {
                l.light.intensity = 0;   
            }
        }
    }

    // Fire: irregular, layered noise + a little wandering of the light source
    updateFlicker(l, seconds) {
        const t = seconds * FLICKER_SPEED * l.speed;
        const flame = fireNoise(t, l.seed);
        l.light.intensity = l.baseIntensity * (1 + FLICKER_BRIGHT * flame);
        l.light.radius = l.baseRadius * (1 + FLICKER_RADIUS * flame);
        l.light.x = l.baseX + FLICKER_DRIFT * noise1D(t * 0.8 + l.seed + 50);
        l.light.y = l.baseY + FLICKER_DRIFT * 0.5 * noise1D(t * 0.8 + l.seed + 90);
    }

    // Plants etc.: a slow, smooth breathing glow
    updatePulse(l, seconds) {
        const t = seconds * (Math.PI * 2 / PULSE_SECONDS) * l.speed;
        const wave = Math.sin(t + l.seed);   // -1..1
        l.light.intensity = l.baseIntensity * (1 + PULSE_BRIGHT * wave);
        l.light.radius = l.baseRadius * (1 + PULSE_RADIUS * wave);
    }
}

// ---- noise for the fire flicker ----
// "Value noise": a random number at every whole step, smoothly blended between.
// Smooth but unpredictable, unlike a sine wave which repeats.

function hash(n) {   // repeatable "random" number in 0..1 for any input
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
}

function noise1D(x) {   // smooth random wobble in -1..1
    const i = Math.floor(x);
    const frac = x - i;
    const smooth = frac * frac * (3 - 2 * frac);
    return (hash(i) + (hash(i + 1) - hash(i)) * smooth) * 2 - 1;
}

// Flames move at several speeds at once: slow sway + faster licks on top.
function fireNoise(t, seed) {
    return 0.55 * noise1D(t + seed)
         + 0.30 * noise1D(t * 2.7 + seed * 3.1)
         + 0.15 * noise1D(t * 6.3 + seed * 7.7);
}

// ---- Tiled helpers ----

// Tiled stores custom properties as [{ name, type, value }, ...]
function getProp(obj, name) {
    return obj.properties?.find(p => p.name === name)?.value;
}

// Tiled color properties look like "#AARRGGBB"; Phaser wants a number like 0xRRGGBB
function parseTiledColor(value) {
    if (value == null) return null;
    let hex = String(value).replace('#', '');
    if (hex.length === 8) hex = hex.slice(2);   // drop the alpha part
    return parseInt(hex, 16);
}