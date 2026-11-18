// Small menu drawn on top of a paused level. Up/down (or W/S) picks an option, Enter or
// Space confirms. Esc also resumes. The level launches it and tells it which level to go back to.
export class Pause extends Phaser.Scene {
    constructor() {
        super('Pause');
    }

    create(data) {
        this.levelKey = data.levelKey;

        this.add.rectangle(160, 90, 130, 70, 0x000000, 0.8);
        this.optionTexts = [
            this.add.text(160, 75, 'RESUME', { fontSize: '14px', fill: '#FFF' }).setOrigin(0.5),
            this.add.text(160, 105, 'QUIT TO MENU', { fontSize: '14px', fill: '#FFF' }).setOrigin(0.5),
        ];

        this.selected = 0;   // index into optionTexts
        this.selectGlow();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,S');

        // event.repeat is true when the key is just being held down, so it only counts a fresh press
        const confirm = (event) => {
            if (event.repeat) return;
            if (this.selected === 0) {
                this.resumeLevel();
            } else {
                this.quitToMenu();
            }
        };
        this.input.keyboard.on('keydown-ENTER', confirm);
        this.input.keyboard.on('keydown-SPACE', confirm);
        this.input.keyboard.on('keydown-ESC', (event) => {
            if (!event.repeat) this.resumeLevel();
        });
    }

    // Adds glow to the selected option and removes it from the other one.
    selectGlow() {
        this.optionTexts.forEach((text, i) => {
            text.preFX.clear();
            if (i === this.selected) {
                text.preFX.addGlow(0xfac500, 2);
            }
        });
    }

    resumeLevel() {
        this.scene.resume(this.levelKey);
        this.scene.stop();
    }

    // Gems from this attempt don't count, same as dying. Lives and unlocks stay as they are.
    // Stopping the level also stops the HUD.
    quitToMenu() {
        this.registry.set('gems', this.scene.get(this.levelKey).startGems);
        this.scene.stop(this.levelKey);
        this.scene.start('Menu');
    }

    update() {
        const up   = Phaser.Input.Keyboard.JustDown(this.cursors.up)   || Phaser.Input.Keyboard.JustDown(this.keys.W);
        const down = Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.keys.S);

        if (up) {
            this.selected = 0;
            this.selectGlow();
        } else if (down) {
            this.selected = 1;
            this.selectGlow();
        }
    }
}
