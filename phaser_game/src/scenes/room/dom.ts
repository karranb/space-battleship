import { HEIGHT, WIDTH } from 'utils/constants'
import BaseDOMHandler from 'utils/dom'
import sendButton from 'assets/send_button.png'
import challengeButton from 'assets/challenge_button.png'
import usersTab from 'assets/users_tab.png'
import identificationBackground from 'assets/background_room.png'
import messagesTab from 'assets/messages_tab.png'
import { CHALLENGE_SECONDS_LIMIT } from 'interfaces/shared'

const html = `
    <div style="position: absolute; left: 0; top: 0; width: ${WIDTH}px; height: ${HEIGHT}px;background: url(${identificationBackground}); background-size: cover;padding: 20px">
        <div style="display: flex; height: 100%; flex-direction: column">
            <div style="flex: 1; position: relative">
            <div style="display: flex; flex-direction: row">
              <div style="display: flex; flex-direction: column; align-items: center; width: 200px">
                <div style="display: flex; flex-direction: column;">
                  <img src="${usersTab}" style="width: 100px; object-fit: contain; margin-left: -.3px;" />
                  <div id="userListSelect" style="border: 1px solid #09aaa0; border-radius: 5px;width: 200px; height: 250px; margin-top: -1px;border-top-left-radius: 0;display: flex; flex-direction: column; padding: 2px; overflow-y: scroll;">
                  </div>
                </div>
                <img id="challengeButton" src="${challengeButton}" style="object-fit: contain; width: 100px; cursor: pointer; margin-top: 10px; margin-bottom: 10px;"/>
              </div>
              <div style="display: flex; flex-direction: column;margin-left: 10px; flex: 1">
                <img src="${messagesTab}" style="width: 100px; object-fit: contain; margin-left: -.3px;" />
                <div id="chatDiv" style="border: 1px solid #09aaa0; border-radius: 5px; height: 250px; margin-top: -1px;border-top-left-radius: 0;display: flex; flex-direction: column; padding: 7px; overflow-y: scroll;background-color: rgba(0,0,0,0.3); color: white; font-size: 12px; font-family: planer">
                </div>
              </div>
            </div>
            <div style="display: flex; flex-direction: row; height: 40px; align-items: center;">
                <input autocomplete="off" id="messageInput" type="text" name="nameField" placeholder="Enter your message" style="font-size: 16px; background-color: transparent; color: white; border: 0; border-bottom: 1px solid #00f7fd;font-family: planer;flex: 1; margin-right: 20px; background-color: rgba(0,0,0,0.3); height: 28px">
                <img src="${sendButton}" id="messageButton" style="object-fit: contain; width: 100px; cursor: pointer"/>
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
    this.createDOM()

    this.userListSelect = this.container?.getChildByID('userListSelect') as HTMLSelectElement
    this.chatDiv = this.container?.getChildByID('chatDiv') as HTMLDivElement
    this.messageButton = this.container?.getChildByID('messageButton') as HTMLButtonElement
    this.challengeButton = this.container?.getChildByID('challengeButton') as HTMLButtonElement
    this.messageInput = this.container?.getChildByID('messageInput') as HTMLInputElement
  }

  public selectItem(id: string) {
    this.userListSelect.querySelectorAll(`div`).forEach(item => {
      item.removeAttribute('selected')
      item.style.backgroundColor = 'rgba(11,62,73,.5)'
    })
    this.userListSelect.querySelectorAll(id).forEach(item => {
      item.setAttribute('selected', 'true')
      ;(item as HTMLDivElement).style.backgroundColor = 'rgba(11,62,73,1)'
    })
  }

  public addUserToUserList(user: { id: string; name: string }): void {
    const optionId = `#user_${user.id}`
    this.userListSelect.querySelectorAll(optionId).forEach(item => item.remove())
    const option = document.createElement('div')
    option.id = optionId.slice(1)
    option.style.backgroundColor = 'rgba(11,62,73,.5)'
    option.style.color = '#00a69d'
    option.style.borderRadius = '3px'
    option.style.marginBottom = '2px'
    option.style.padding = '5px'
    option.style.fontSize = '12px'
    option.style.fontFamily = 'planer'
    option.innerText = user.name
    option.style.cursor = 'pointer'
    option.setAttribute('user_id', user.id)
    option.onclick = () => {
      this.selectItem(optionId)
    }
    this.userListSelect.appendChild(option)
  }

  public createUserJoinedMessage(name: string): void {
    const message = document.createElement('span')
    const nameSpan = document.createElement('span')
    nameSpan.style.color = '#00a69d'
    nameSpan.innerText = name
    message.appendChild(nameSpan)
    message.innerHTML = message.innerHTML + ' joined =)'
    this.addMessage(message)
  }

  public addQuittedMessage(name: string): void {
    const message = document.createElement('span')
    const nameSpan = document.createElement('span')
    nameSpan.style.color = '#00a69d'
    nameSpan.innerText = name
    message.appendChild(nameSpan)
    message.innerHTML = message.innerHTML + ' quitted =('
    this.addMessage(message)
  }

  public getOptionFromUserList(id: string): HTMLOptionElement | null {
    return this.userListSelect.querySelector(`#user_${id}`)
  }

  public getUserNameFromList(id: string): string | undefined {
    return this.getOptionFromUserList(id)?.innerText
  }

  public removeUserFromUserList(id: string): void {
    this.getOptionFromUserList(id)?.remove()
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
    this.chatDiv.scrollTo(0, this.chatDiv.scrollHeight);
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

  public setChallengeClosed(challengeId: string, reason: string) {
    const challengeSuffix = document.querySelector(`#challenge-${challengeId}`) as HTMLDivElement
    challengeSuffix.innerText = reason
  }

  public addChallengedMessage(
    challengerId: string,
    challengeId: string,
    sendChallengeAccept: (id: string) => void,
    sendChallengeRefuse: (id: string) => void
  ): void {
    const name = this.getUserNameFromList(challengerId)
    const challengeText = document.createElement('span')
    const nameSpan = document.createElement('span')
    nameSpan.style.color = '#00a69d'
    nameSpan.innerText = name ?? ''
    challengeText.appendChild(nameSpan)
    challengeText.innerHTML = `The user ${challengeText.innerHTML} challenged you`
    const suffix = document.createElement('span')
    suffix.innerText = ' - '
    const acceptButton = this.createChallengeResponseButton('ACCEPT', () =>
      sendChallengeAccept(challengeId)
    )
    acceptButton.style.color = '#29b5ff'
    acceptButton.style.cursor = 'pointer'
    const pipe = document.createElement('span')
    pipe.innerText = ' | '
    const refuseButton = this.createChallengeResponseButton('REFUSE', () =>
      sendChallengeRefuse(challengeId)
    )
    refuseButton.style.color = '#29b5ff'
    refuseButton.style.cursor = 'pointer'
    suffix.appendChild(acceptButton)
    suffix.appendChild(pipe)
    suffix.appendChild(refuseButton)
    const space = document.createElement('span')
    space.innerText = ' '
    suffix.appendChild(space)
    suffix.id = `challenge-${challengeId}`
    const timeSpan = document.createElement('span')
    timeSpan.innerText = `${CHALLENGE_SECONDS_LIMIT}`
    timeSpan.className = 'time'
    suffix.appendChild(timeSpan)
    challengeText.appendChild(suffix)

    const timer = window.setInterval(() => {
      const time = suffix.querySelector('.time') as HTMLSpanElement
      if (!time) {
        window.clearInterval(timer)
        return
      }
      if (Number(timeSpan.innerText) <= 1) {
        suffix.remove()
        window.clearInterval(timer)
        return
      }
      time.innerText = `${Number(timeSpan.innerText) - 1}`
    }, 1000)
    this.addMessage(challengeText)
  }

  public getSelectedUser(): string | undefined {
    const userOption = this.userListSelect.querySelector(`div[selected="true"]`)
    if (userOption) {
      return userOption.getAttribute('user_id') ?? undefined
    }
    return undefined
  }

  public addChallengeSentText(
    challengedId: string,
    challengeId: string,
    handleCancelChallengeClick: (value: string) => void
  ): void {
    const message = document.createElement('span')

    const name = document.createElement('span')
    name.style.color = '#00a69d'
    name.innerText = this.getUserNameFromList(challengedId) ?? ''
    message.appendChild(name)
    const cancel = document.createElement('span')
    cancel.innerText = 'CANCEL'
    cancel.style.color = '#29b5ff'
    cancel.style.cursor = 'pointer'
    cancel.className = 'cancel-button'

    cancel.addEventListener('click', () => handleCancelChallengeClick(challengeId))
    message.innerHTML = `You challenged ${message.innerHTML}`
    const suffix = document.createElement('span')
    suffix.innerText = ' - '
    suffix.appendChild(cancel)
    const space = document.createElement('span')
    space.innerText = ' '
    suffix.appendChild(space)
    suffix.id = `challenge-${challengeId}`

    const timeSpan = document.createElement('span')
    timeSpan.className = 'time'
    timeSpan.innerText = `${CHALLENGE_SECONDS_LIMIT}`
    suffix.appendChild(timeSpan)
    message.appendChild(suffix)
    const timer = window.setInterval(() => {
      const time = suffix.querySelector('.time') as HTMLSpanElement
      if (!time) {
        window.clearInterval(timer)
        return
      }
      time.innerText = `${Number(timeSpan.innerText) - 1}`
    }, 1000)
    this.addMessage(message)
  }
}

export default RoomDOMHandler
