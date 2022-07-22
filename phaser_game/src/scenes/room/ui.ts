import { Message, MessageType, RoomTemplate, RoomTemplateProps } from './template'
import BaseUIHandler from 'utils/ui'
import { CHALLENGE_SECONDS_LIMIT } from 'interfaces/shared'

class RoomUI extends BaseUIHandler {
  public constructor(
    scene: Phaser.Scene,
    props: Pick<
      RoomTemplateProps,
      | 'handleSubmitMessage'
      | 'handleSubmitChallenge'
      | 'handleRefuseChallengeClick'
      | 'handleAcceptChallengeClick'
      | 'handleCloseChallengeClick'
    >
  ) {
    super(scene)
    const newProps = { ...props, users: [], messages: [] }
    this.createTemplate(RoomTemplate as React.FC, newProps)
  }

  getUsers(): Record<string, string> {
    return (this.props?.users ?? {}) as Record<string, string>
  }

  updateUsers(users: Record<string, string>) {
    this.updateProps({ ...this.props, users: users })
  }

  removeUser(value: string) {
    const users = Object.entries(this.getUsers()).reduce(
      (acc: Record<string, string>, [id, name]: string[]) => {
        if (id === value) {
          return acc
        }
        return { ...acc, [id]: name }
      },
      {}
    )
    this.updateUsers(users)
  }
  getMessages() {
    return this.props?.messages ?? []
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

  getUserName(userId: string) {
    return (this.props?.users as Record<string, string>)[userId]
  }

  addQuittedMessage(userId: string) {
    this.addMessage({
      name: this.getUserName(userId),
      type: MessageType.QUITTED,
    })
  }

  addJoinedMessage(name: string) {
    this.addMessage({
      name,
      type: MessageType.JOINED,
    })
  }

  addUserMessage(id: string, message: string) {
    this.addMessage({
      name: this.getUserName(id),
      type: MessageType.USER,
      message,
    })
  }

  addTimer(challengeId: string) {
    const timer = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        const message = (this.props?.messages as Message[]).find(
          message => message.id === challengeId
        )
        if (!message || message.inactiveReason || !message.time) {
          timer.destroy()
          return
        }
        this.updateProps({
          messages: (this.props?.messages as Message[]).map(item =>
            item.id === challengeId && item.time ? { ...item, time: item.time - 1 } : item
          ),
        })
      },
    })
  }

  setChallengeClosedMessage(challengeId: string, reason: string) {
    const message = (this.props?.messages as Message[]).find(
      message => message.id === challengeId
    )
    if (!message || message.inactiveReason || !message.time) {
      return
    }
    this.updateProps({
      messages: (this.props?.messages as Message[]).map(item =>
        item.id === challengeId && item.time ? { ...item, inactiveReason: reason } : item
      ),
    })
  }

  addChallengedMessage(userId: string, challengeId: string) {
    this.addMessage({
      name: this.getUserName(userId),
      type: MessageType.CHALLENGED,
      id: challengeId,
      time: CHALLENGE_SECONDS_LIMIT,
    })
    this.addTimer(challengeId)
  }

  addChallengerMessage(userId: string, challengeId: string) {
    this.addMessage({
      name: this.getUserName(userId),
      type: MessageType.CHALLENGER,
      id: challengeId,
      time: CHALLENGE_SECONDS_LIMIT,
    })
    this.addTimer(challengeId)
  }

  addErrorMessage(message: string) {
    this.addMessage({
      type: MessageType.ERROR,
      message,
    })
  }

  sendMessage() {
    const input = document.querySelector('#input') as HTMLInputElement
    const handleSubmitMessage = this.props?.handleSubmitMessage as (message: string) => void
    handleSubmitMessage(input.value)
    input.value = ''
  }

  // // addQuittedMessage

  // // addMessage(id: string, name: string) {
  // //   this.users = [...this.users, { id, name }]
  // // }

  // public selectItem(id: string) {
  //   // this.userListSelect.querySelectorAll(`div`).forEach(item => {
  //   //   item.removeAttribute('selected')
  //   //   item.style.backgroundColor = 'rgba(11,62,73,.5)'
  //   // })
  //   // this.userListSelect.querySelectorAll(id).forEach(item => {
  //   //   item.setAttribute('selected', 'true')
  //   //   ;(item as HTMLDivElement).style.backgroundColor = 'rgba(11,62,73,1)'
  //   // })
  // }

  // public addUserToUserList(user: { id: string; name: string }): void {
  //   // const optionId = `#user_${user.id}`
  //   // this.userListSelect.querySelectorAll(optionId).forEach(item => item.remove())
  //   // const option = document.createElement('div')
  //   // option.id = optionId.slice(1)
  //   // option.style.backgroundColor = 'rgba(11,62,73,.5)'
  //   // option.style.color = '#00a69d'
  //   // option.style.borderRadius = '3px'
  //   // option.style.marginBottom = '2px'
  //   // option.style.padding = '5px'
  //   // option.style.fontSize = '12px'
  //   // option.style.fontFamily = 'planer'
  //   // option.innerText = user.name
  //   // option.style.cursor = 'pointer'
  //   // option.setAttribute('user_id', user.id)
  //   // option.onclick = () => {
  //   //   this.selectItem(optionId)
  //   // }
  //   // this.userListSelect.appendChild(option)
  // }

  // public createUserJoinedMessage(name: string): void {
  //   // const message = document.createElement('span')
  //   // const nameSpan = document.createElement('span')
  //   // nameSpan.style.color = '#00a69d'
  //   // nameSpan.innerText = name
  //   // message.appendChild(nameSpan)
  //   // message.innerHTML = message.innerHTML + ' joined =)'
  //   // this.addMessage(message)
  // }

  // // public addQuittedMessage(name: string): void {
  // //   // const message = document.createElement('span')
  // //   // const nameSpan = document.createElement('span')
  // //   // nameSpan.style.color = '#00a69d'
  // //   // nameSpan.innerText = name
  // //   // message.appendChild(nameSpan)
  // //   // message.innerHTML = message.innerHTML + ' quitted =('
  // //   // this.addMessage(message)
  // // }

  // public getOptionFromUserList(id: string): HTMLOptionElement | null {
  //   return null
  //   // return this.userListSelect.querySelector(`#user_${id}`)
  // }

  // public getUserNameFromList(id: string): string | undefined {
  //   return undefined
  //   // return this.getOptionFromUserList(id)?.innerText
  // }

  // public removeUserFromUserList(id: string): void {
  //   // this.getOptionFromUserList(id)?.remove()
  // }

  // // public addUserMessage(name: string, message: string): void {
  // //   // const lineSpan = document.createElement('span')
  // //   // const userName = document.createElement('span')
  // //   // const messageSpan = document.createElement('span')
  // //   // userName.style.color = '#00a69d'
  // //   // userName.innerText = name + ': '
  // //   // messageSpan.innerText = message
  // //   // lineSpan.appendChild(userName)
  // //   // lineSpan.appendChild(messageSpan)
  // //   // this.addMessage(lineSpan)
  // // }

  // // public addMessage(message: string | HTMLElement): void {
  // //   // const lineSpan = document.createElement('span')
  // //   // if (typeof message === 'string') {
  // //   //   lineSpan.innerText = message
  // //   //   this.chatDiv.appendChild(lineSpan)
  // //   // } else {
  // //   //   this.chatDiv.appendChild(message)
  // //   // }
  // //   // this.chatDiv.scrollTo(0, this.chatDiv.scrollHeight);
  // // }

  // public setOnSubmitMessage(handleSubmit: () => void): void {
  //   // this.messageButton.addEventListener('click', handleSubmit)
  // }

  // public getMessageInputValue(): string {
  //   return ''
  //   // return this.messageInput.value
  // }

  // public resetMessageInputValue(): void {
  //   // this.messageInput.value = ''
  // }

  // public setChallengeButtonOnClick(handleRequestChallenge: () => void): void {
  //   // this.challengeButton.addEventListener('click', handleRequestChallenge)
  // }

  // public createChallengeResponseButton(
  //   label: string,
  //   handleOnClick: () => void
  // ): HTMLElement | null {
  //   // const button = document.createElement('span')
  //   // button.addEventListener('click', handleOnClick)
  //   // button.innerText = label
  //   // return button
  //   return null
  // }

  // public setChallengeClosed(challengeId: string, reason: string) {
  //   // const challengeSuffix = document.querySelector(`#challenge-${challengeId}`) as HTMLDivElement
  //   // challengeSuffix.innerText = reason
  // }

  // // public addChallengedMessage(
  // //   challengerId: string,
  // //   challengeId: string,
  // //   sendChallengeAccept: (id: string) => void,
  // //   sendChallengeRefuse: (id: string) => void
  // // ): void {
  // //   // const name = this.getUserNameFromList(challengerId)
  // //   // const challengeText = document.createElement('span')
  // //   // const nameSpan = document.createElement('span')
  // //   // nameSpan.style.color = '#00a69d'
  // //   // nameSpan.innerText = name ?? ''
  // //   // challengeText.appendChild(nameSpan)
  // //   // challengeText.innerHTML = `The user ${challengeText.innerHTML} challenged you`
  // //   // const suffix = document.createElement('span')
  // //   // suffix.innerText = ' - '
  // //   // const acceptButton = this.createChallengeResponseButton('ACCEPT', () =>
  // //   //   sendChallengeAccept(challengeId)
  // //   // )
  // //   // acceptButton.style.color = '#29b5ff'
  // //   // acceptButton.style.cursor = 'pointer'
  // //   // const pipe = document.createElement('span')
  // //   // pipe.innerText = ' | '
  // //   // const refuseButton = this.createChallengeResponseButton('REFUSE', () =>
  // //   //   sendChallengeRefuse(challengeId)
  // //   // )
  // //   // refuseButton.style.color = '#29b5ff'
  // //   // refuseButton.style.cursor = 'pointer'
  // //   // suffix.appendChild(acceptButton)
  // //   // suffix.appendChild(pipe)
  // //   // suffix.appendChild(refuseButton)
  // //   // const space = document.createElement('span')
  // //   // space.innerText = ' '
  // //   // suffix.appendChild(space)
  // //   // suffix.id = `challenge-${challengeId}`
  // //   // const timeSpan = document.createElement('span')
  // //   // timeSpan.innerText = `${CHALLENGE_SECONDS_LIMIT}`
  // //   // timeSpan.className = 'time'
  // //   // suffix.appendChild(timeSpan)
  // //   // challengeText.appendChild(suffix)
  // //   // const timer = window.setInterval(() => {
  // //   //   const time = suffix.querySelector('.time') as HTMLSpanElement
  // //   //   if (!time) {
  // //   //     window.clearInterval(timer)
  // //   //     return
  // //   //   }
  // //   //   if (Number(timeSpan.innerText) <= 1) {
  // //   //     suffix.remove()
  // //   //     window.clearInterval(timer)
  // //   //     return
  // //   //   }
  // //   //   time.innerText = `${Number(timeSpan.innerText) - 1}`
  // //   // }, 1000)
  // //   // this.addMessage(challengeText)
  // // }

  // public getSelectedUser(): string | undefined {
  //   // const userOption = this.userListSelect.querySelector(`div[selected="true"]`)
  //   // if (userOption) {
  //   //   return userOption.getAttribute('user_id') ?? undefined
  //   // }
  //   return undefined
  // }

  // public addChallengeSentText(
  //   challengedId: string,
  //   challengeId: string,
  //   handleCancelChallengeClick: (value: string) => void
  // ): void {
  //   // const message = document.createElement('span')
  //   // const name = document.createElement('span')
  //   // name.style.color = '#00a69d'
  //   // name.innerText = this.getUserNameFromList(challengedId) ?? ''
  //   // message.appendChild(name)
  //   // const cancel = document.createElement('span')
  //   // cancel.innerText = 'CANCEL'
  //   // cancel.style.color = '#29b5ff'
  //   // cancel.style.cursor = 'pointer'
  //   // cancel.className = 'cancel-button'
  //   // cancel.addEventListener('click', () => handleCancelChallengeClick(challengeId))
  //   // message.innerHTML = `You challenged ${message.innerHTML}`
  //   // const suffix = document.createElement('span')
  //   // suffix.innerText = ' - '
  //   // suffix.appendChild(cancel)
  //   // const space = document.createElement('span')
  //   // space.innerText = ' '
  //   // suffix.appendChild(space)
  //   // suffix.id = `challenge-${challengeId}`
  //   // const timeSpan = document.createElement('span')
  //   // timeSpan.className = 'time'
  //   // timeSpan.innerText = `${CHALLENGE_SECONDS_LIMIT}`
  //   // suffix.appendChild(timeSpan)
  //   // message.appendChild(suffix)
  //   // const timer = window.setInterval(() => {
  //   //   const time = suffix.querySelector('.time') as HTMLSpanElement
  //   //   if (!time) {
  //   //     window.clearInterval(timer)
  //   //     return
  //   //   }
  //   //   time.innerText = `${Number(timeSpan.innerText) - 1}`
  //   // }, 1000)
  //   // this.addMessage(message)
  // }
}

export default RoomUI
