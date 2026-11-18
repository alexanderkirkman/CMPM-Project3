// Values that carry over from level to level, and back through the menu.
// They live in the game registry, so every scene can read them. Nothing is saved to
// disk, so reloading the page starts over.
// To add one (like a power-up), give it a starting value here.
const RUN_DEFAULTS = {
    gems: 0,
    lives: 5,
};

// Start a new run: put every default back into the registry
export function newRun(registry) {
    for (const key in RUN_DEFAULTS) {
        registry.set(key, RUN_DEFAULTS[key]);
    }
}
