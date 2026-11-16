import { GEM_FRAME } from '../config.js';

// Shown after the last level. Enter or Space goes back to the menu.
export class Win extends Phaser.Scene {
    constructor() {
        super('Win');
    }

    create() {
        this.add.text(160, 50, 'YOU WIN!', { fontSize: '32px', fill: '#fac500' })
            .setOrigin(0.5)
            .preFX.addGlow(0xfac500, 2);

        // Gems collected over the whole run (the tilesheet was already loaded by the levels)
        const total = this.registry.get('gems');
        this.add.image(140, 100, 'tiles_transparent', GEM_FRAME);
        this.add.text(152, 100, 'x ' + total, { fontSize: '16px', fill: '#FFF' }).setOrigin(0, 0.5);

        this.add.text(160, 145, 'Press ENTER or SPACE', { fontSize: '12px', fill: '#FFF' }).setOrigin(0.5);

        // event.repeat is true when the key is just being held down from the level,
        // so it only counts a fresh press
        const backToMenu = (event) => {
            if (!event.repeat) this.scene.start('Menu');
        };
        this.input.keyboard.on('keydown-ENTER', backToMenu);
        this.input.keyboard.on('keydown-SPACE', backToMenu);
    }
}
