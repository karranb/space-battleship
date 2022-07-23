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

  updateUserIsPlaying(userId: string, isPlaying: boolean) {
    const newUsers = { ...((this.props?.users as Record<string, { isPlaying: boolean }>) ?? {}) }
    newUsers[userId] = { ...newUsers[userId], isPlaying }
    this.updateProps({ users: newUsers })
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
    return (this.props?.users as Record<string, { name: string }>)[userId].name
  }

  addBackFromGameMessage(userId: string) {
    this.addMessage({
      name: this.getUserName(userId),
      type: MessageType.IS_BACK_FROM_GAME,
    })
  }

  addJoinedAGameMessage(userId: string) {
    this.addMessage({
      name: this.getUserName(userId),
      type: MessageType.IS_PLAYING,
    })
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
    const message = (this.props?.messages as Message[]).find(message => message.id === challengeId)
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
}

export default RoomUI
