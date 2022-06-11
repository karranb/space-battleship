import { HEIGHT, WIDTH } from 'utils/constants'
import BaseDOMHandler from 'utils/dom'

const html = `
    <div style="position: absolute; left: 0; top: 0; width: ${WIDTH}px; height: ${HEIGHT}px">
        <div style="display: flex; height: 100%; flex-direction: column">
            <div style="flex: 1; position: relative">
                <div style="flex: 1; display: flex; flex-direction: row">
                    <select id="userListSelect" size="1000" style="height: 300px; width: 200px">
                    </select>
                    <div style="flex: 1; border: 1px solid white; color: white; overflow-y: scroll; max-height: 300px;" id="chatDiv"></div>
                </div>
            <input type="button"  id="challengeButton" style="width: 100px" value="Challenge" />
            </div>
            <div style="display: flex; flex-direction: row; height: 40px">
                <input id="messageInput" type="text" name="nameField" placeholder="Enter your message" style="font-size: 16px; background-color: black; border: 1px solid white; color: white; flex: 1">
                <input type="button" id="messageButton" style="font-size: 16px" value="Send" />
            </div>
        </div>
    </div>
`

class RoomDOMHandler extends BaseDOMHandler {
  private userListSelect: HTMLSelectElement
  private chatDiv: HTMLDivElement
  private messageButton: HTMLButtonElement
  private challengeButton: HTMLButtonElement
  private messageInput: HTMLInputElement

  public constructor(scene: Phaser.Scene) {
    super(scene, html)

    this.userListSelect = this.container.getChildByID('userListSelect') as HTMLSelectElement
    this.chatDiv = this.container.getChildByID('chatDiv') as HTMLDivElement
    this.messageButton = this.container.getChildByID('messageButton') as HTMLButtonElement
    this.challengeButton = this.container.getChildByID('challengeButton') as HTMLButtonElement
    this.messageInput = this.container.getChildByID('messageInput') as HTMLInputElement
  }

  public addUserToUserList(user: { id: string; name: string }): void {
    this.userListSelect
      .querySelectorAll(`option[value="${user.id}"]`)
      .forEach(item => item.remove())
    const option = document.createElement('option')
    option.value = user.id
    option.text = user.name
    this.userListSelect.appendChild(option)
  }

  public getOptionFromUserList(id: string): HTMLOptionElement | null {
    return this.userListSelect.querySelector(`option[value="${id}"]`)
  }

  public getUserNameFromList(id: string): string | undefined {
    return this.getOptionFromUserList(id)?.innerText
  }

  public removeUserFromUserList(id: string): void {
    this.getOptionFromUserList(id)?.remove()
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

  public setChallengeButtonOnClick(handleRequestChallenge: () => void): void {
    this.challengeButton.addEventListener('click', handleRequestChallenge)
  }

  public createChallengeResponseButton(label: string, handleOnClick: () => void): HTMLElement {
    const button = document.createElement('span')
    button.addEventListener('click', handleOnClick)
    button.innerText = label
    return button
  }

  public addChallengedMessage(
    id: string,
    sendChallengeAccept: (id: string) => void,
    sendChallengeRefuse: (id: string) => void
  ): void {
    const name = this.getUserNameFromList(id)
    const challengeText = document.createElement('span')
    challengeText.innerText = `The user ${name} challenged you. `
    const acceptButton = this.createChallengeResponseButton('Accept', () => sendChallengeAccept(id))
    const pipe = document.createElement('span')
    pipe.innerText = ' | '
    const refuseButton = this.createChallengeResponseButton('Refuse', () => sendChallengeRefuse(id))
    challengeText.appendChild(acceptButton)
    challengeText.appendChild(pipe)
    challengeText.appendChild(refuseButton)
    this.addMessage(challengeText)
  }

  public getSelectedUser(): string {
    return this.userListSelect.value
  }

  public createChallengeSentText(
    value: string,
    handleCancelChallengeClick: (value: string) => void
  ): void {
    const message = document.createElement('span')
    message.innerText = `You challenged ${this.getUserNameFromList(value)}. `
    const cancel = document.createElement('span')
    cancel.innerText = 'Cancel'
    cancel.addEventListener('click', () => handleCancelChallengeClick(value))
    message.appendChild(cancel)
    this.addMessage(message)
  }
}

export default RoomDOMHandler
