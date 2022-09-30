import BaseUIHandler from 'utils/ui'

import { GameTemplate, GameTemplateProps, Message } from './template'

export enum ResultTypes {
  victory = 'victory',
  defeat = 'defeat',
  draw = 'draw',
}

class GameUI extends BaseUIHandler {
  public constructor(scene: Phaser.Scene, props: GameTemplateProps) {
    super(scene)
    this.createTemplate(GameTemplate as React.FC, props)
  }

  sendMessage() {
    const input = document.querySelector('#input') as HTMLInputElement
    const handleSubmitMessage = this.props?.handleSubmitMessage as (message: string) => void
    handleSubmitMessage(input.value)
    input.value = ''
  }

  async addMessage(message: Message) {
    this.updateProps({ ...this.props, messages: [...(this.props?.messages as Message[]), message] })
    const messages = document.querySelector('#messages') as HTMLDivElement
    this.scene.time.addEvent({
      delay: 10,
      callback: () => {
        messages.scrollTo(0, messages.scrollHeight + 100)
      },
    })
  }

  setisWaitingOponent(isWaitingOponent: boolean) {
    this.updateProps({ isWaitingOponent })
  }

  setBadge(result: ResultTypes) {
    this.updateProps({
      badge: result,
    })
  }
}

export default GameUI
