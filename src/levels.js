import { DEV_UNLOCK_ALL } from './config.js';

// Every level in the game, in menu order. Only list levels that have a map.
// main.js makes a scene for each one. Level3 loads assets/maps/level3.json, and so on.
export const LEVELS = [
    { key: 'Level1', name: 'LEVEL 1' },
    { key: 'Level2', name: 'LEVEL 2' },
    { key: 'Level3', name: 'LEVEL 3' },
    { key: 'Level4', name: 'LEVEL 4' },
    { key: 'Level5', name: 'LEVEL 5' },
    { key: 'Level6', name: 'LEVEL 6' },
];

// unlockedLevel in the registry is the index in LEVELS of the highest unlocked level.
export function isLevelUnlocked(registry, index) {
    return DEV_UNLOCK_ALL || index <= registry.get('unlockedLevel');
}
