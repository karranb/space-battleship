abstract class BaseDOMHandler {
  protected scene: Phaser.Scene
  protected html: string
  protected DOM?: Phaser.GameObjects.DOMElement
  protected container?: Phaser.GameObjects.DOMElement

  public constructor(scene: Phaser.Scene, html: string) {
    this.scene = scene
    this.html = html
  }

  public createDOM() {
    this.DOM = this.scene.add.dom(0, 0)
    this.container = this.DOM.createFromHTML(this.html)
    document.getElementById('backDiv')?.addEventListener('click', () => {
      // document.body.requestFullscreen()
    })
  }

  public removeDOM(): void {
    this.DOM?.removeElement()
  }
}

export default BaseDOMHandler
