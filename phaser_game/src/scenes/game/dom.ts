import { HEIGHT, WIDTH } from 'utils/constants'
import BaseDOMHandler from 'utils/dom'
import buttonBackground from 'assets/button-background.png'
import spaceshipArrowImage from 'assets/spaceship-select-arrow.png'
import victoryBadge from 'assets/victory_badge.png'
import defeatBadge from 'assets/defeat_badge.png'
import drawBadge from 'assets/draw_badge.png'

const domWidth = 220

const html = (isChallenger: boolean, challengerName: string, challengedName: string) => `
  <div id="backDiv" style='position: absolute; left: ${
    WIDTH - domWidth
  }px; top: 0; width: ${domWidth}px; height: ${HEIGHT}px;'>
    <div style="position: absolute; right: 0px; top: 0; width: ${domWidth}px; height: ${HEIGHT}px; background-color: rgba(0,0,0,.51); border-left: 2px solid #01c9cf; padding: 10px">
      <div style="display: flex; flex-direction: column;">
        <div>
          <div style="background-color: rgba(183,17,17,.41); color: white; font-family: planer; padding: 5px;">
            <span>${isChallenger ? 'You' : challengerName}</span>
          </div>

          <div style="background-color: rgba(44,24,154,.41); color: white; font-family: planer; padding: 5px;margin-top: 7px;">
            <span>${isChallenger ? challengedName : 'You'}</span>
          </div>
        </div>
        <div style="border-top: 1px dashed #01c9cf; width: 100%; margin-top: 15px"></div>
        <span style="color: white; font-family: planer;margin-top: 15px;font-size: 12px">
          1. Click on one of your spaceships<br/>
          2. Select a destination inside the reachable area<br/>
          3. Click on a place to shoot<br/>
          4. Repeat steps 1-3 to the other spaceships<br/>
          5. Press Done
        </span>
          <div style="display: flex; color: white; font-family: neuropol; align-items: center; justify-content: center; font-size: 12px;position: relative;width: 50%; margin-left: auto; margin-right: auto; height: 40px; margin-top: 10px;cursor: pointer;font-size: 10px;" id="doneButton">
            DONE
            <img src="${buttonBackground}" style="object-fit: contain; z-index: 0; position: absolute; width: 100%" />
          </div>
          <span style="display: none; font-family: neuropol; color: white;margin-top: 10px;font-size: 12px;" id="waitingSpan">
        WAITING OPONENT
      </span>
      </div>
      

      <div style="border-top: 1px dashed #01c9cf; width: 100%; margin-top: 15px"></div>

      <div id="chatDiv" style="background-color: rgba(79,79,79,.35); width: 100%; height: 60px;margin-top: 15px; color: white; font-family: planer; font-size: 12px;display: flex; flex-direction: column; overflow-y: scroll"></div>

      <div style="margin-top: 5px; display: flex; align-items: center; justify-content: space-between;">
        <input id="messageInput" style="background-color: rgba(79,79,79,.35); border: 0;border-bottom: 1px solid #01c9cf; flex: 1; color: white;font-size: 12px;font-family: planer;"/> 
        <img id="messageButton" src="${spaceshipArrowImage}" style=" width: 15px; object-fit: contain; margin-left: 5px; cursor: pointer" />
      </div>
    </div>
  </div>
  <div id="finalOverlay" style="display: none; position: absolute; width: ${WIDTH}px; height: ${HEIGHT}px; left: 0; top: 0; background-color: rgba(0,0,0,0.8)">
    <img id="finalBadge" src="${victoryBadge}" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 400px"/>
  </div>
`

class GameDOMHandler extends BaseDOMHandler {
  private chatDiv: HTMLDivElement
  private messageButton: HTMLButtonElement
  private doneButton: HTMLDivElement
  private messageInput: HTMLInputElement
  private waitingSpan: HTMLSpanElement
  private finalOverlay: HTMLDivElement
  private finalBadge: HTMLImageElement
  public constructor(
    scene: Phaser.Scene,
    isChallenger: boolean,
    challengerName: string,
    challengedName: string
  ) {
    super(scene, html(isChallenger, challengerName, challengedName))
    this.createDOM()
    this.chatDiv = this.container?.getChildByID('chatDiv') as HTMLDivElement
    this.messageButton = this.container?.getChildByID('messageButton') as HTMLButtonElement
    this.messageInput = this.container?.getChildByID('messageInput') as HTMLInputElement
    this.waitingSpan = this.container?.getChildByID('waitingSpan') as HTMLSpanElement
    this.doneButton = this.container?.getChildByID('doneButton') as HTMLDivElement
    this.finalOverlay = this.container?.getChildByID('finalOverlay') as HTMLDivElement
    this.finalBadge = this.container?.getChildByID('finalBadge') as HTMLImageElement
  }

  public showBadge(result: 'victory' | 'defeat' | 'draw'): void {
    this.finalOverlay.style.display = 'block'
    this.finalBadge.src =
      result === 'victory' ? victoryBadge : result === 'defeat' ? defeatBadge : drawBadge
  }

  public showWaitingOponent(): void {
    this.waitingSpan.style.display = 'block'
    this.doneButton.style.display = 'none'
  }

  public showReadyButton(): void {
    this.waitingSpan.style.display = 'none'
    this.doneButton.style.display = 'flex'
  }

  public addUserMessage(name: string, message: string): void {
    const lineSpan = document.createElement('span')
    const userName = document.createElement('span')
    const messageSpan = document.createElement('span')
    userName.style.color = '#00a69d'
    userName.innerText = name + ': '
    messageSpan.innerText = message
    lineSpan.appendChild(userName)
    lineSpan.appendChild(messageSpan)
    this.addMessage(lineSpan)
  }

  public addMessage(message: string | HTMLElement): void {
    const lineSpan = document.createElement('span')
    if (typeof message === 'string') {
      lineSpan.innerText = message
      this.chatDiv.appendChild(lineSpan)
    } else {
      this.chatDiv.appendChild(message)
    }
    this.chatDiv.scrollTo(0, this.chatDiv.scrollHeight)
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

  public setReadyOnClick(evt: () => void) {
    ;(document.querySelector('#doneButton') as HTMLDivElement).addEventListener('click', evt)
  }
}

export default GameDOMHandler
