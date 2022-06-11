abstract class BaseDOMHandler {
  protected DOM: Phaser.GameObjects.DOMElement
  protected container: Phaser.GameObjects.DOMElement

  public constructor(scene: Phaser.Scene, html: string) {
    this.DOM = scene.add.dom(0, 0)
    this.container = this.DOM.createFromHTML(html)
  }

  public removeDOM(): void {
    this.DOM.removeElement()
  }
}

export default BaseDOMHandler
