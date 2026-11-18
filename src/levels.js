import { DEV_UNLOCK_ALL } from './config.js';

// Every level slot in the game, in menu order. Some maps may not exist yet.
// main.js makes a scene for each one. Level3 loads assets/maps/level3.json, and so on.
export const LEVELS = [
    { key: 'Level1', name: 'LEVEL 1' },
    { key: 'Level2', name: 'LEVEL 2' },
    { key: 'Level3', name: 'LEVEL 3' },
    { key: 'Level4', name: 'LEVEL 4' },
    { key: 'Level5', name: 'LEVEL 5' },
    { key: 'Level6', name: 'LEVEL 6' },
    { key: 'Level7', name: 'LEVEL 7' },
    { key: 'Level8', name: 'LEVEL 8' },
    { key: 'Level9', name: 'LEVEL 9' },
    { key: 'Level10', name: 'LEVEL 10' },
];

// A level can only be played if its scene is registered in main.js.
// scene is whichever Phaser scene is asking.
export function isLevelAvailable(scene, level) {
    return scene.scene.get(level.key) !== null;
}

// unlockedLevel in the registry is the index in LEVELS of the highest unlocked level.
export function isLevelUnlocked(registry, index) {
    return DEV_UNLOCK_ALL || index <= registry.get('unlockedLevel');
}
