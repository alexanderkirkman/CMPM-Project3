const LEVEL_DATA = [{ 
    name: 'Level1',
    level: 1,
    map: 'assets/maps/level1.json'
  }, 
  {
    name: 'Level2',
    level: 2,
    map: 'assets/maps/level2.json'
  }]

export class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }
    
  preload() {
  }

  create() {
    // Remove event handlers on scene shutdown to avoid bugs
    this.events.once("shutdown", () => {
      this.registry.events.off("changedata-lvlSelect")
    });

    // Add level select text
    // this.add.text(12, 0, "LEVEL SELECT", { fontSize: '41px', fill: '#FFF', align: "center" });
    this.lvl1 = this.add.text(40, 90, 'LEVEL 1', { fontSize: '20px', fill: '#FFF', align: "center" });
    this.lvl2 = this.add.text(196, 90, 'LEVEL 2', { fontSize: '20px', fill: '#FFF', align: "center" });

    // Use of registry isn't strictly necessary but makes use of events
    // to handle the level selection glow easier. 
    this.registry.set("lvlSelect", 1);
    this.glow1 = null;
    this.glow2 = null;
    this.selectGlow(this.registry.get("lvlSelect")); // intialize the selection glow
    // change glow when the selected level changes
    this.registry.events.on("changedata-lvlSelect", (parent, value, previous) => this.selectGlow(value));

    // Set up input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,SPACE,ENTER');
  }

  // Adds glow to the appropriate level text and removes any glow from the other. 
  selectGlow(i) {
    if (i == 1) {
        this.glow1 = this.lvl1.preFX.addGlow(0xfac500, 2);
        this.lvl2.preFX.remove(this.glow2);
      } else if (i == 2) {
        this.glow2 = this.lvl2.preFX.addGlow(0xfac500, 2);
        this.lvl1.preFX.remove(this.glow1);
      }
  }

  update(time) {
    const confirm = Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER);
    const left  = Phaser.Input.Keyboard.JustDown(this.cursors.left)  || Phaser.Input.Keyboard.JustDown(this.keys.A);
    const right = Phaser.Input.Keyboard.JustDown(this.cursors.right)  || Phaser.Input.Keyboard.JustDown(this.keys.D);
    
    // Change selected level
    if (left && this.registry.get("lvlSelect") > 1) {
      this.registry.inc("lvlSelect", -1);
    } else if (right && this.registry.get("lvlSelect") < 2) {
      this.registry.inc("lvlSelect", 1);
    }

    // Start selected level
    if (confirm) {
      this.scene.stop('Menu');
      this.scene.start("Start", LEVEL_DATA[this.registry.get("lvlSelect") - 1]) 
    }

  }
}