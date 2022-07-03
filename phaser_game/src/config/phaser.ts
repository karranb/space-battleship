import { HEIGHT, WIDTH } from 'utils/constants'

export const PHASER_CONFIG = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH,
    height: HEIGHT,
    orientation: Phaser.Scale.Orientation.LANDSCAPE,
  },
  antialias: true,
  parent: 'app',
  dom: { createContainer: true },
  title: 'Title',
  version: '0.0.1',
  physics: {
    default: 'arcade',
    arcade: {
      // debug: true,
      // debugShowBody: true,
      // debugShowStaticBody: true,
      // debugShowVelocity: true,
      // debugVelocityColor: 0xffff00,
      // debugBodyColor: 0x0000ff,
      // debugStaticBodyColor: 0xffffff,
    },
  },
}
