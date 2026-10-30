// PixelLightPipeline: a custom version of Phaser 3.90's Light2D shader, built for pixel art.
//
// Compared to the built-in Light2D it:
//   1. uses a simple falloff with a bright core and a long, soft tail
//   2. snaps brightness into a few levels (bands), like a limited pixel-art palette
//   3. DITHERS between those levels with a 4x4 Bayer pattern, so bands blend in a
//      checkerboard-y retro way instead of forming hard rings
//   4. shifts the color toward white near the center (a "hot core" like a real flame)
//
// The dither pattern is locked to the WORLD, not the screen, so it doesn't "swim"
// when the camera scrolls.
//
// Registered in main.js under the name 'PixelLight'.
// Use it with:  gameObject.setPipeline('PixelLight')
//
// Note: normal maps are ignored by this shader (we don't use them).

// ---- Tuning ----
const LIGHT_STEPS = 6;      // how many brightness levels (lower = chunkier, 3-8 is a good range)
const DITHER = 1.0;         // 0 = hard rings, 1 = full dithering between rings
const FALLOFF = 2.0;        // 1 = linear fade, 2 = soft (default), 3+ = tight core with a long dim tail
const CORE_WHITE = 0.6;     // 0 = no hot core, 1 = center goes fully white
const CORE_START = 0.55;    // how bright a pixel must be before it starts whitening (0..1+)

const f = (n) => Number(n).toFixed(3);   // GLSL needs floats written like 1.000

const fragShader = `
#define SHADER_NAME PIXEL_LIGHT_FS
precision mediump float;

struct Light
{
    vec2 position;
    vec3 color;
    float intensity;
    float radius;
};

const int kMaxLights = %LIGHT_COUNT%;   // Phaser fills this in from maxLights in the config

const float kSteps     = ${f(LIGHT_STEPS)};
const float kDither    = ${f(DITHER)};
const float kFalloff   = ${f(FALLOFF)};
const float kCoreWhite = ${f(CORE_WHITE)};
const float kCoreStart = ${f(CORE_START)};

uniform vec4 uCamera; /* x, y, rotation, zoom */
uniform vec2 uScroll; /* camera scroll, rounded (set in onRender below) */
uniform sampler2D uMainSampler;
uniform vec3 uAmbientLightColor;
uniform Light uLights[kMaxLights];
uniform int uLightCount;

varying vec2 outTexCoord;
varying float outTexId;
varying float outTintEffect;
varying vec4 outTint;

// 4x4 ordered-dither threshold (0..1) for a pixel position
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

void main ()
{
    // ---- the sprite/tile's own color (unchanged from Phaser) ----
    vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);
    vec4 texture = texture2D(uMainSampler, outTexCoord);
    vec4 color = texture * texel;
    if (outTintEffect == 1.0)
    {
        color.rgb = mix(texture.rgb, outTint.bgr * outTint.a, texture.a);
    }
    else if (outTintEffect == 2.0)
    {
        color = texel;
    }

    // Dither threshold for this pixel, anchored to the world so it scrolls with the level.
    // (gl_FragCoord.y counts up from the bottom, world y counts down, hence the minus.)
    vec2 worldPixel = gl_FragCoord.xy + vec2(uScroll.x, -uScroll.y);
    float threshold = mix(0.5, bayer4(worldPixel), kDither);

    // ---- add up every light ----
    vec3 finalColor = vec3(0.0);
    for (int index = 0; index < kMaxLights; ++index)
    {
        if (index < uLightCount)
        {
            Light light = uLights[index];

            // 0 at the light's center, 1 at its edge
            float d = length(light.position - gl_FragCoord.xy) / (light.radius * uCamera.w);
            if (d < 1.0)
            {
                float brightness = pow(1.0 - d, kFalloff) * light.intensity;

                // snap to kSteps levels; the dither threshold decides which way
                // in-between pixels round, giving that checkerboard blend
                float level = floor(brightness * kSteps + threshold) / kSteps;

                // hot core: brighter pixels drift toward white
                float heat = clamp((brightness - kCoreStart) / (1.0 - kCoreStart), 0.0, 1.0);
                vec3 lightColor = mix(light.color, vec3(1.0), heat * kCoreWhite);

                finalColor += lightColor * level;
            }
        }
    }

    gl_FragColor = color * vec4(uAmbientLightColor + finalColor, 1.0);
}
`;

export class PixelLightPipeline extends Phaser.Renderer.WebGL.Pipelines.LightPipeline {
    constructor(game) {
        super({ game, fragShader });
    }

    // Phaser's LightPipeline sets the light uniforms here; we add the camera scroll
    // so the dither pattern can stay fixed to the world.
    onRender(scene, camera) {
        super.onRender(scene, camera);
        this.set2f('uScroll', Math.round(camera.scrollX), Math.round(camera.scrollY));
    }
}