import { Level1 } from './scenes/Level1.js';
import { Level2 } from './scenes/Level2.js';

// Every level in the game, in menu order.
// To add one: make a scene file in src/scenes and add a line here.
// key must match the key the scene passes to super().
export const LEVELS = [
    { key: 'Level1', name: 'LEVEL 1', scene: Level1 },
    { key: 'Level2', name: 'LEVEL 2', scene: Level2 },
];
