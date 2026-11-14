// Tiny 3x5 pixel font for the HUD. Normal Phaser text is blurry at this size,
// so we draw the characters ourselves and turn them into a bitmap font called 'pixelFont'.
const FONT_CHARS = '0123456789x ';
const FONT_GLYPHS = [
    ['###', '#.#', '#.#', '#.#', '###'],   // 0
    ['.#.', '##.', '.#.', '.#.', '###'],   // 1
    ['###', '..#', '###', '#..', '###'],   // 2
    ['###', '..#', '###', '..#', '###'],   // 3
    ['#.#', '#.#', '###', '..#', '..#'],   // 4
    ['###', '#..', '###', '..#', '###'],   // 5
    ['###', '#..', '###', '#.#', '###'],   // 6
    ['###', '..#', '..#', '..#', '..#'],   // 7
    ['###', '#.#', '###', '#.#', '###'],   // 8
    ['###', '#.#', '###', '..#', '###'],   // 9
    ['...', '#.#', '.#.', '#.#', '...'],   // x
    ['...', '...', '...', '...', '...'],   // space
];

// Textures and the bitmap font cache are shared by the whole game, so this only
// builds the font the first time it's called.
export function makePixelFont(scene) {
    if (scene.cache.bitmapFont.exists('pixelFont')) return;

    // One row of characters, each 3px wide plus 1px gap. '2' is white in Phaser's palette.
    const rows = [];
    for (let r = 0; r < 5; r++) {
        rows.push(FONT_GLYPHS.map(g => g[r] + '.').join('').replaceAll('#', '2'));
    }
    scene.textures.generate('pixelFont', { data: rows, pixelWidth: 1 });

    const font = Phaser.GameObjects.RetroFont.Parse(scene, {
        image: 'pixelFont', width: 4, height: 5, chars: FONT_CHARS, charsPerRow: FONT_CHARS.length,
    });
    // Narrow space: with the 1px gap after "x", "x 3" gets a 2px gap (4px at 2x scale)
    font.data.chars[32].xAdvance = 1;
    scene.cache.bitmapFont.add('pixelFont', font);
}
