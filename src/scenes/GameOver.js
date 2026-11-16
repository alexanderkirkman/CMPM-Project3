// Shown when the player runs out of lives. Enter or Space goes back to the menu.
export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    create() {
        this.add.text(160, 70, 'GAME OVER', { fontSize: '32px', fill: '#d03030' })
            .setOrigin(0.5)
            .preFX.addGlow(0xd03030, 2);

        this.add.text(160, 130, 'Press ENTER or SPACE', { fontSize: '12px', fill: '#FFF' }).setOrigin(0.5);

        // event.repeat is true when the key is just being held down from the level,
        // so it only counts a fresh press
        const backToMenu = (event) => {
            if (!event.repeat) this.scene.start('Menu');
        };
        this.input.keyboard.on('keydown-ENTER', backToMenu);
        this.input.keyboard.on('keydown-SPACE', backToMenu);
    }
}
