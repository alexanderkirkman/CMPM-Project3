import { Menu } from './scenes/Menu.js';
import { Level } from './scenes/Level.js';
import { Level1 } from './scenes/Level1.js';
import { Level2 } from './scenes/Level2.js';
import { HUD } from './scenes/HUD.js';
import { Win } from './scenes/Win.js';
import { GameOver } from './scenes/GameOver.js';
import { Pause } from './scenes/Pause.js';
import { PixelLightPipeline } from './pipelines/PixelLightPipeline.js';
import { LEVELS } from './levels.js';
import { newRun } from './run.js';

// Levels that have their own class. Every other level is a plain Level scene.
const levelClasses = { Level1, Level2 };

const levelScenes = LEVELS.map(level => {
    const LevelClass = levelClasses[level.key];
    if (LevelClass) {
        return new LevelClass();
    }
    return new Level(level.key, level.key.toLowerCase());   // Level3 uses level3.json
});

const config = {
    type: Phaser.AUTO,
    title: "Shadow's Bane",
    description: 'A vertical 2D platformer game that makes fun use of phasers unique lighting and shader system',
    parent: 'game-container',
    width: 320,
    height: 180,
    roundPixels: true,                                 // stops sprites shimmering between pixels
    pipeline: { PixelLight: PixelLightPipeline },      // registers the shader under the name 'PixelLight'
    maxLights: 64,                                     // 64 should be able to run on all modern devices (lights on screen at a given moment)
    backgroundColor: '#000000',
    pixelArt: true,             // keep Kenney's tiny sprites crisp when scaled up
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 800 }, fps: 120, debug: false },
    },
    // The first scene in the list runs first: the Menu, which starts the chosen level.
    // HUD and Pause go last so they draw on top of the levels.
    scene: [Menu, ...levelScenes, Win, GameOver, HUD, Pause],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

const game = new Phaser.Game(config);

// Starting progress, set once when the page loads
newRun(game.registry);
game.registry.set('unlockedLevel', 0);   // only Level 1 (index 0 in LEVELS) starts unlocked
