import { LEVELS } from '../levels.js';

export class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    // Remove event handlers on scene shutdown to avoid bugs
    this.events.once("shutdown", () => {
      this.registry.events.off("changedata-lvlSelect")
    });

    // One text per level, two per row
    this.levelTexts = LEVELS.map((level, i) => {
      const x = 40 + (i % 2) * 156;
      const y = 90 + Math.floor(i / 2) * 30;
      return this.add.text(x, y, level.name, { fontSize: '20px', fill: '#FFF', align: "center" });
    });

    // Use of registry isn't strictly necessary but makes use of events
    // to handle the level selection glow easier.
    // lvlSelect is an index into LEVELS (0 = first level).
    this.registry.set("lvlSelect", 0);
    this.selectGlow(this.registry.get("lvlSelect")); // initialize the selection glow
    // change glow when the selected level changes
    this.registry.events.on("changedata-lvlSelect", (parent, value, previous) => this.selectGlow(value));

    // Set up input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,SPACE,ENTER');
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

  update(time) {
    const confirm = Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER);
    const left  = Phaser.Input.Keyboard.JustDown(this.cursors.left)  || Phaser.Input.Keyboard.JustDown(this.keys.A);
    const right = Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.keys.D);

    // Change selected level
    if (left && this.registry.get("lvlSelect") > 0) {
      this.registry.inc("lvlSelect", -1);
    } else if (right && this.registry.get("lvlSelect") < LEVELS.length - 1) {
      this.registry.inc("lvlSelect", 1);
    }

    // Start selected level
    if (confirm) {
      this.scene.start(LEVELS[this.registry.get("lvlSelect")].key);
    }
  }
}
