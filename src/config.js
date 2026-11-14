// Tuning numbers for the player and level lighting.

// Which tile in the tilesheet to use as the player.
// In Tiled, click the character tile in the Tilesets panel; the "ID" shown in the
// Properties panel is this number (for the first tileset, ID = frame index).
export const PLAYER_FRAME = 240;

export const MOVE_SPEED = 100;      // pixels per second, left/right
export const JUMP_SPEED = 360;      // initial upward speed when jumping
export const AIR_JUMPS = 1;         // extra jumps allowed in mid-air (1 = double jump, 2 = triple...)
export const AIR_JUMP_SPEED = 300;  // mid-air jumps are a bit weaker than the first jump
export const COYOTE_TIME = 100;     // ms after leaving a ledge where a jump still counts as a ground jump

// Lighting
export const AMBIENT_COLOR = 0x101018;   // how dark the level is where no light reaches (0x000000 = pitch black)
// Player light. Other nice colors: 0xb79cff (soft lavender), 0x7fffd4 (aquamarine)
export const PLAYER_GLOW = { radius: 40, color: 0xffd9a0, intensity: 0.75 };   // warm candle
export const PLAYER_PULSE = {
    seconds: 3,      // one slow "breath" (grow + shrink)
    radius: 0.08,    // radius grows/shrinks by +/-8%
    bright: 0.15,    // brightness goes up/down by +/-15%
};
