// Values that carry over from level to level during one run (one play from the menu).
// They live in the game registry, so every scene can read them.
// To add one (like a power-up), give it a starting value here.
export const RUN_DEFAULTS = {
    gems: 0,
    lives: 3,
};

// Start a new run: put every default back into the registry
export function newRun(registry) {
    for (const key in RUN_DEFAULTS) {
        registry.set(key, RUN_DEFAULTS[key]);
    }
}
