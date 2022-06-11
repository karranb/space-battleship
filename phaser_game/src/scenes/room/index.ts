import 'phaser'
import { Socket } from 'socket.io-client'
import { SCENES } from 'utils/constants'
import RoomDOMHandler from './dom'
import RoomSocketHandler from './socket'

class Room extends Phaser.Scene {
  private DOMHandler: RoomDOMHandler | undefined
  private socketHandler: RoomSocketHandler | undefined
  private returnKey: Phaser.Input.Keyboard.Key | undefined

  constructor() {
    super(SCENES.Room)
  }

  init(data: { webSocketClient: Socket }): void {
    this.socketHandler = new RoomSocketHandler(data.webSocketClient)
    this.DOMHandler = new RoomDOMHandler(this)
    this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
  }

  destroyScene = (): void => {
    this.children.destroy()
    this.socketHandler?.destroy()
    this.returnKey?.off('down')
  }

  setupWebsocketListeners = (): void => {
    const handleChallengeRefuseClick = (id: string): void =>
      this.socketHandler?.sendMessageRefuse(id)

    const handleChallengeCancelClick = (id: string): void =>
      this.socketHandler?.sendMessageCancel(id)

    const handleChallengeAcceptClick = (id: string): void =>
      this.socketHandler?.sendMessageAccept(id)

    const handleGetUsersList = (value: string): void =>
      JSON.parse(value).forEach((item: { id: string; name: string }) =>
        this.DOMHandler?.addUserToUserList({ id: item.id, name: item.name })
      )

    const handleUserDisconnected = (value: string): void => {
      const name = this.DOMHandler?.getUserNameFromList(value)
      this.DOMHandler?.removeUserFromUserList(value)
      this.DOMHandler?.addMessage(`${name} quitted =(`)
    }

    const handleRefuseChallenge = (id: string): void => {
      const name = this.socketHandler?.isMe(id) ? 'You' : this.DOMHandler?.getUserNameFromList(id)
      this.DOMHandler?.addMessage(`${name} refused the challenge`)
    }

    const handleCancelChallenge = (id: string): void => {
      const name = this.socketHandler?.isMe(id) ? 'You' : this.DOMHandler?.getUserNameFromList(id)
      this.DOMHandler?.addMessage(`${name} canceled the challenge`)
    }

    const handleAcceptChallenge = (message: string): void => {
      const { enemy, challenger } = JSON.parse(message)
      this.destroyScene()
      this.scene.launch(SCENES.ShipsSelect, {
        webSocketClient: this.socketHandler?.getWebSocketClient(),
        enemy,
        challenger,
      })
    }

    const handleChallenge = (value: string): void =>
      this.DOMHandler?.addChallengedMessage(
        value,
        handleChallengeAcceptClick,
        handleChallengeRefuseClick
      )

    const handleUserConnected = (value: string): void => {
      const item = JSON.parse(value)
      this.DOMHandler?.addUserToUserList(item)
      this.DOMHandler?.addMessage(`${item.name} joined =)`)
    }

    const handleChallengeSent = (value: string): void =>
      this.DOMHandler?.createChallengeSentText(value, handleChallengeCancelClick)

    const handleRoomMessage = (value: string): void => {
      const { name, message } = JSON.parse(value)
      this.DOMHandler?.addMessage(`${name}: ${message}`)
    }

    this.socketHandler?.createRoomSocketHandler({
      handleGetUsersList,
      handleUserDisconnected,
      handleUserConnected,
      handleRoomMessage,
      handleChallenge,
      handleChallengeSent,
      handleAcceptChallenge,
      handleCancelChallenge,
      handleRefuseChallenge,
    })
  }

  setupButtonListeners = (): void => {
    const handleSubmitClick = (): void => {
      this.socketHandler?.sendMessage(this.DOMHandler?.getMessageInputValue() ?? '')
      this.DOMHandler?.resetMessageInputValue()
    }

    const handleRequestChallengeClick = (): void => {
      const selectedValue = this.DOMHandler?.getSelectedUser()
      if (!selectedValue) {
        this.DOMHandler?.addMessage('You need to select someone to challenge')
        return
      }
      if (this.socketHandler?.isMe(selectedValue)) {
        this.DOMHandler?.addMessage("You can't challenge yourself, select someone else")
        return
      }
      this.socketHandler?.sendChallenge(selectedValue)
    }
    this.DOMHandler?.setOnSubmitMessage(handleSubmitClick)
    this.DOMHandler?.setChallengeButtonOnClick(handleRequestChallengeClick)
    this.returnKey?.on('down', handleSubmitClick)
  }

  create(): void {
    this.setupButtonListeners()
    this.setupWebsocketListeners()
    this.socketHandler?.sendGetUsersList()
  }
}

export default Room
