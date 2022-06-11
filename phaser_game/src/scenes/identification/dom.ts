import { HEIGHT, WIDTH } from 'utils/constants'
import BaseDOMHandler from 'utils/dom'

const html = `
  <div style="position: absolute; left: 0; top: 0; width: ${WIDTH}px; height: ${HEIGHT}px">
      <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
          <div style="display: flex; flex-direction: column; margin-top: auto; margin-bottom: auto; margin-left: auto; margin-right: auto">
              <input id="nicknameInput" type="text" name="nameField" placeholder="Enter your nickname" style="font-size: 16px">
              <input type="button" id="signinButton" style="font-size: 16px" value="Enter" />
          </div>
      </div>
  </div>
`

class IdentificationDOMHandler extends BaseDOMHandler {
  private nicknameInput: HTMLInputElement
  private signinButton: HTMLButtonElement

  public constructor(scene: Phaser.Scene) {
    super(scene, html)
    this.nicknameInput = this.container.getChildByID('nicknameInput') as HTMLInputElement
    this.signinButton = this.container.getChildByID('signinButton') as HTMLButtonElement
  }

  public getNicknameInputValue = (): string => {
    return this.nicknameInput.value
  }

  public setSigninButtonOnClick = (evt: () => void): void => {
    this.signinButton.addEventListener('click', evt)
  }
}

export default IdentificationDOMHandler
