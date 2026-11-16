import { Menu } from './scenes/Menu.js';
import { Level1 } from './scenes/Level1.js';
import { Level2 } from './scenes/Level2.js';
import { HUD } from './scenes/HUD.js';
import { Win } from './scenes/Win.js';
import { GameOver } from './scenes/GameOver.js';
import { PixelLightPipeline } from './pipelines/PixelLightPipeline.js';

const config = {
    type: Phaser.AUTO,
    title: 'Bane of Darkness',
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
    // HUD goes last so it draws on top of the levels.
    scene: [Menu, Level1, Level2, Win, GameOver, HUD],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
