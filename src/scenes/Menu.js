import { LEVELS, isLevelUnlocked } from '../levels.js';

// Level select. Left/right (or A/D) picks an unlocked level, Enter or Space starts it.
// Locked levels are dimmed.
export class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        // Remove event handlers on scene shutdown to avoid bugs
        this.events.once('shutdown', () => {
            this.registry.events.off('changedata-levelSelect');
        });

        // One text per level, five per row. The number goes under "LEVEL" so it all fits.
        this.levelTexts = LEVELS.map((level, i) => {
            const x = 32 + (i % 5) * 64;
            const y = 65 + Math.floor(i / 5) * 50;
            const label = level.name.replace(' ', '\n');
            const text = this.add.text(x, y, label, { fontSize: '14px', fill: '#FFF', align: 'center' });
            text.setOrigin(0.5);
            if (!isLevelUnlocked(this.registry, i)) {
                text.setAlpha(0.3);
            }
            return text;
        });

        // Use of registry isn't strictly necessary but makes use of events
        // to handle the level selection glow easier.
        // levelSelect is an index into LEVELS (0 = first level).
        this.registry.set('levelSelect', 0);
        this.selectGlow(this.registry.get('levelSelect')); // initialize the selection glow
        // change glow when the selected level changes
        this.registry.events.on('changedata-levelSelect', (parent, value) => this.selectGlow(value));

        // Set up input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('A,D');

        // Start selected level
        // event.repeat is true when the key is just being held down from the last screen,
        // so it only counts a fresh press
        const startLevel = (event) => {
            if (!event.repeat) {
                this.scene.start(LEVELS[this.registry.get('levelSelect')].key);
            }
        };
        this.input.keyboard.on('keydown-ENTER', startLevel);
        this.input.keyboard.on('keydown-SPACE', startLevel);
    }

    // Adds glow to the selected level text and removes it from the rest.
    selectGlow(index) {
        this.levelTexts.forEach((text, i) => {
            text.preFX.clear();
            if (i === index) {
                text.preFX.addGlow(0xfac500, 2);
            }
        });
    }

    update() {
        const left  = Phaser.Input.Keyboard.JustDown(this.cursors.left)  || Phaser.Input.Keyboard.JustDown(this.keys.A);
        const right = Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.keys.D);

        // Change selected level. Unlocked levels are always in a row from Level 1,
        // so moving right just stops at the first locked one.
        const select = this.registry.get('levelSelect');
        if (left && select > 0) {
            this.registry.inc('levelSelect', -1);
        } else if (right && select < LEVELS.length - 1 && isLevelUnlocked(this.registry, select + 1)) {
            this.registry.inc('levelSelect', 1);
        }
    }
}
