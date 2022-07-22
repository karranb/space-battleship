import React from 'react'
import ReactDOM from 'react-dom/client'

abstract class BaseUIHandler {
  protected scene: Phaser.Scene
  protected DOM?: Phaser.GameObjects.DOMElement
  protected container?: Phaser.GameObjects.DOMElement
  protected root?: ReactDOM.Root
  protected template?: React.FC
  protected props?: Record<string, unknown> 

  public constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  public createTemplate(template: (React.FC), props?: Record<string, unknown>) {
    this.DOM = this.scene.add.dom(0, 0)
    this.props = props
    this.container = this.DOM.createFromHTML('<div id="ui"></div>')
    this.template = template
    const domContainer = document.querySelector('#ui') as HTMLDivElement
    this.root = ReactDOM.createRoot(domContainer)
    this.root.render(React.createElement(template, props))
  }

  public updateProps(props?: Record<string, unknown>) {
    this.props = {...this.props, ...props}
    if (this.root && this.template) {
      this.root.render(React.createElement(this.template, this.props))
    }
  }
}

export default BaseUIHandler
