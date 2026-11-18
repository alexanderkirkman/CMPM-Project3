import { TileObject, getProp } from './TileObject.js';

// A bouncePad from Tiled (a tile object with the class "bouncePad").
// Will immediately launch the player upon contact with the top of the pad
// bounceForce: determines the velocity of the launch
export class BouncePad extends TileObject {
  constructor(scene, map, obj, player) {
    super(scene, map, obj);
    // Default is equivalent to a regular jump
    this.bounceForce = getProp(obj, 'bounceForce') ?? 300;
    scene.physics.add.collider(player, this, (p) => this.onTouch(p));
  }

  // Called after the player bumps into it. touching says which of OUR sides got hit.
  onTouch(p) {
    const t = this.body.touching;

    if (t.up) {
      p.setVelocityY(-this.bounceForce);
      // TODO: Spring animation
    }
  }
}