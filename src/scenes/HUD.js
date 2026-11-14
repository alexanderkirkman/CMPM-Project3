import { Counter } from '../ui/Counter.js';
import { makePixelFont } from '../ui/pixelFont.js';
import { GEM_FRAME } from '../config.js';

// Draws the UI on top of the level. It has its own camera, so nothing here scrolls
// with the map, and nothing uses PixelLight, so it's never darkened.
// The level launches it and stops it; values come in through the registry.
export class HUD extends Phaser.Scene {
    constructor() {
        super('HUD');
    }

    create() {
        makePixelFont(this);

        this.addCounter('gems', GEM_FRAME, 4, 10);
    }

    // Shows the registry value `key` next to a tile icon and keeps it up to date
    addCounter(key, frame, x, y) {
        const counter = new Counter(this, x, y, 'tiles_transparent', frame, this.registry.get(key) ?? 0);

        const onChange = (parent, value) => counter.setValue(value);
        this.registry.events.on('changedata-' + key, onChange);
        // The registry outlives this scene, so remove the listener when the HUD stops
        this.events.once('shutdown', () => this.registry.events.off('changedata-' + key, onChange));

        return counter;
    }
}
