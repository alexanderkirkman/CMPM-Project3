// Tuning numbers for the game, grouped by what they affect.

// ---- Tiles ----
// Frame numbers in the tilesheet. In Tiled, click a tile in the Tilesets panel; the "ID"
// shown in the Properties panel is this number (for the first tileset, ID = frame index).
export const PLAYER_FRAME = 240;   // the player (also the lives icon in the HUD)
export const GEM_FRAME = 102;      // gem tile, used for the gem counter icon

// ---- Player movement ----
export const MOVE_SPEED = 100;      // pixels per second, left/right
export const JUMP_SPEED = 300;      // initial upward speed when jumping
export const AIR_JUMPS = 0;         // extra jumps allowed in mid-air (0 = off, 1 = double jump, 2 = triple...)
export const AIR_JUMP_SPEED = 300;  // mid-air jumps are a bit weaker than the first jump
export const COYOTE_TIME = 100;     // ms after leaving a ledge where a jump still counts as a ground jump

// Wall slide + wall jump
export const WALL_SLIDE_SPEED = 40;   // max fall speed while holding into a wall in the air
export const WALL_JUMP_X = 70;       // sideways push away from the wall
export const WALL_JUMP_Y = 280;       // upward speed of a wall jump
export const WALL_JUMP_LOCK = 150;    // ms after a wall jump where left/right input is ignored

// Hazards: Tiled classes that become a Hazard (see Hazard.js for danger-x / danger-y).
// Add new ones here, like 'saw' or 'lava'.
export const HAZARD_CLASSES = ['spike'];

// One-way platforms
export const DROP_TIME = 200;        // ms the player falls through platforms after pressing down on one
export const PLATFORM_SPEED = 40;    // default moving platform speed (pixels per second)

// ---- Player animations ----
// Frames from tiles_transparent; these face right, flipped for left.
// repeat: true loops it, false plays once and holds the last frame.
// Enemies can get their own object in the same shape.
export const PLAYER_ANIMS = {
    idle: { frames: [240],      frameRate: 1, repeat: false },
    run:  { frames: [242, 243], frameRate: 8, repeat: true },
    jump: { frames: [244],      frameRate: 1, repeat: false },
    fall: { frames: [245],      frameRate: 1, repeat: false },
};

// ---- Camera ----
// Deadzone: box in the middle of the screen (in pixels; screen is 320x180).
// The camera only moves once the player leaves this box.
export const CAMERA_DEADZONE = { width: 32, height: 60 };

// ---- Lighting ----
export const AMBIENT_COLOR = 0x101018;   // how dark the level is where no light reaches (0x000000 = pitch black)
// Player light. Other nice colors: 0xb79cff (soft lavender), 0x7fffd4 (aquamarine)
export const PLAYER_GLOW = { radius: 40, color: 0xffd9a0, intensity: 0.75 };   // warm candle
export const PLAYER_PULSE = {
    seconds: 3,      // one slow "breath" (grow + shrink)
    radius: 0.08,    // radius grows/shrinks by +/-8%
    bright: 0.15,    // brightness goes up/down by +/-15%
};
