// An icon with a count next to it, like "[gem] x 3".
// (x, y) is the middle of its left edge. Needs the 'pixelFont' from pixelFont.js.
export class Counter extends Phaser.GameObjects.Container {
    constructor(scene, x, y, texture, frame, value = 0) {
        super(scene, x, y);

        // Children are placed relative to the container, both centered on y = 0
        this.icon = scene.add.image(0, 0, texture, frame).setOrigin(0, 0.5);
        // Tiles have about 4px of empty space on their right, which is the gap before the "x"
        this.label = scene.add.bitmapText(this.icon.width, 0, 'pixelFont', '')
            .setScale(2)
            .setOrigin(0, 0.5);

        this.add([this.icon, this.label]);
        scene.add.existing(this);
        this.setValue(value);
    }

    setValue(value) {
        this.label.setText('x ' + value);
    }
}
