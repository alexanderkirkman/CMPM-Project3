import { Menu } from './scenes/MainMenu.js';
import { LEVELS } from './levels.js';
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
    // The first scene in the list runs first: the Menu, which starts the chosen level.
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 800 }, debug: false },
    },
    scene: [Menu, ...LEVELS.map(level => level.scene)],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
