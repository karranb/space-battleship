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
    // this.DOMHandler?.removeDOM()
    // this.children.destroy()
    // this.socketHandler?.destroy()
    // this.returnKey?.off('down')
    // this.scene.stop(SCENES.Room);
    // this.scene.remove(SCENES.Room)
  }

  setupWebsocketListeners = (): void => {
    const handleChallengeRefuseClick = (id: string): void => {
      this.socketHandler?.sendMessageRefuse(id)
    }

    const handleChallengeCancelClick = (id: string): void => {
      this.socketHandler?.sendMessageCancel(id)
    }

    const handleChallengeAcceptClick = (id: string): void =>
      this.socketHandler?.sendMessageAccept(id)

    const handleGetUsersList = (value: string): void =>
      JSON.parse(value).forEach((item: { id: string; name: string }) =>
        this.DOMHandler?.addUserToUserList({ id: item.id, name: item.name })
      )

    const handleUserDisconnected = (value: string): void => {
      const name = this.DOMHandler?.getUserNameFromList(value)
      this.DOMHandler?.removeUserFromUserList(value)
      this.DOMHandler?.addQuittedMessage(name ?? '')
    }

    const handleCloseChallenge = (value: string): void => {
      const { challengeId, reason } = JSON.parse(value)
      if (reason === 'TIMEOUT') {
        this.DOMHandler?.setChallengeClosed(challengeId, ' - The challenge timed out')
        return
      }
      const name = this.socketHandler?.isMe(reason)
        ? 'You'
        : this.DOMHandler?.getUserNameFromList(reason)
      this.DOMHandler?.setChallengeClosed(
        challengeId,
        ` - ${name ?? 'The opponent'} canceled the challenge`
      )
    }

    const handleErrorChallenge = (value: string): void => {
      const { message } = JSON.parse(value)
      this.DOMHandler?.addMessage(message)
    }

    const handleAcceptChallenge = (message: string): void => {
      const { challenger, challenged } = JSON.parse(message)
      this.destroyScene()
      const challengerName = this.DOMHandler?.getUserNameFromList(challenger)
      const challengedName = this.DOMHandler?.getUserNameFromList(challenged)
      this.scene.start(SCENES.ShipsSelect, {
        webSocketClient: this.socketHandler?.getWebSocketClient(),
        challenged,
        challenger,
        challengerName,
        challengedName,
      })
    }

    const handleChallenge = (value: string): void => {
      const { challengeId, challengerId, challengedId } = JSON.parse(value)
      if (this.socketHandler?.isMe(challengedId)) {
        this.DOMHandler?.addChallengedMessage(
          challengerId,
          challengeId,
          handleChallengeAcceptClick,
          handleChallengeRefuseClick
        )
        return
      }
      if (this.socketHandler?.isMe(challengerId)) {
        this.DOMHandler?.addChallengeSentText(challengedId, challengeId, handleChallengeCancelClick)
      }
    }

    const handleUserConnected = (value: string): void => {
      const item = JSON.parse(value)
      this.DOMHandler?.addUserToUserList(item)
      this.DOMHandler?.createUserJoinedMessage(item.name)
    }

    const handleRoomMessage = (value: string): void => {
      const { id, message } = JSON.parse(value)
      const name = this.DOMHandler?.getUserNameFromList(id)
      this.DOMHandler?.addUserMessage(name ?? '', message)
    }

    const handleDisconnect = () => {
      this.scene.start(SCENES.Identification)
    }

    this.socketHandler?.createRoomSocketHandler({
      handleGetUsersList,
      handleUserDisconnected,
      handleUserConnected,
      handleRoomMessage,
      handleChallenge,
      handleAcceptChallenge,
      handleCloseChallenge,
      handleErrorChallenge,
      handleDisconnect,
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
    this.DOMHandler?.setChallengeButtonOnClick(handleRequestChallengeClick)
    this.DOMHandler?.setOnSubmitMessage(handleSubmitClick)
    this.returnKey?.on('down', handleSubmitClick)
  }

  create(): void {
    this.setupButtonListeners()
    this.setupWebsocketListeners()
    this.socketHandler?.sendGetUsersList()
  }
}

export default Room
