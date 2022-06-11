import './style.css'
import 'normalize.css'
import 'phaser'
import { PHASER_CONFIG } from './config/phaser'
import Identification from 'scenes/identification'
import Room from 'scenes/room'
import { SCENES } from './utils/constants'
import ShipsSelect from 'scenes/ships-select'
import GameScene from 'scenes/game'

class Game extends Phaser.Game {
  constructor() {
    super(PHASER_CONFIG)
    this.scene.add(SCENES.Identification, Identification)
    this.scene.add(SCENES.Room, Room)
    this.scene.add(SCENES.ShipsSelect, ShipsSelect)
    this.scene.add(SCENES.Game, GameScene)
    this.scene.start(SCENES.Identification)
    
    // this.scene.start(SCENES.Game)
  }
}
// Create new instance of game
window.onload = function (): void {
  
  new Game()

}
