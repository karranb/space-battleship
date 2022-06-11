import { HEIGHT, WIDTH } from 'utils/constants'
import BaseDOMHandler from 'utils/dom'

const domWidth = 220

const html = `
    <div style="position: absolute; left: ${
      WIDTH - domWidth
    }px; top: 0; width: ${domWidth}px; height: ${HEIGHT}px">
        <div style="display: flex; height: calc(100% - 40px); margin-top: 40px; flex-direction: column">
          <div style="flex: 1; border: 1px solid white; color: white; overflow-y: scroll; height: ${
            HEIGHT - 40
          }px;" id="chatDiv"></div>
              <div style="display: flex; flex-direction: row; height: 40px">
                <input id="messageInput" type="text" name="nameField" placeholder="Enter your message" style="font-size: 16px; background-color: black; border: 1px solid white; color: white; flex: 1">
                <input type="button" id="messageButton" style="font-size: 16px" value="Send" />
            </div>
          </div>
    </div>
`

class GameDOMHandler extends BaseDOMHandler {
  private chatDiv: HTMLDivElement
  private messageButton: HTMLButtonElement
  private messageInput: HTMLInputElement

  public constructor(scene: Phaser.Scene) {
    super(scene, html)

    this.chatDiv = this.container.getChildByID('chatDiv') as HTMLDivElement
    this.messageButton = this.container.getChildByID('messageButton') as HTMLButtonElement
    this.messageInput = this.container.getChildByID('messageInput') as HTMLInputElement
  }

  public addMessage(message: string | HTMLElement): void {
    this.chatDiv.innerHTML += this.chatDiv.innerHTML ? '<br/>' : ''
    if (typeof message !== 'string') {
      this.chatDiv.appendChild(message)
      return
    }
    this.chatDiv.innerHTML += message
  }

  public setOnSubmitMessage(handleSubmit: () => void): void {
    this.messageButton.addEventListener('click', handleSubmit)
  }

  public getMessageInputValue(): string {
    return this.messageInput.value
  }

  public resetMessageInputValue(): void {
    this.messageInput.value = ''
  }
}

export default GameDOMHandler
