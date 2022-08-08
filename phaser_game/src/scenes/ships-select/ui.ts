import BaseUIHandler from 'utils/ui'

import { ShipsSelectTemplate, ShipsSelectTemplateProps } from './template'

class ShipsSelectUI extends BaseUIHandler {
  public constructor(scene: Phaser.Scene, props: ShipsSelectTemplateProps) {
    super(scene)
    this.createTemplate(ShipsSelectTemplate as React.FC, props)


    const timer = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        const timerSpan = document.querySelector('#timer') as HTMLSpanElement
        if (timerSpan && Number(timerSpan?.innerText) <= 0) {
          timer.destroy()
          return
        }
        this.updateProps({ timer: Number(timerSpan?.innerText) - 1 })
      },
    })
  }

  setIsWaitingOponent() {
    this.updateProps({ waitingOponent: true })
  }
}

export default ShipsSelectUI
