import { HEIGHT, WIDTH } from 'utils/constants'
import BaseDOMHandler from 'utils/dom'
import identificationBackground from 'assets/background_menu.png'
import multiplayerButton from 'assets/join_server.png'

const html = `
  <div id="backDiv" style='position: absolute; left: 0; top: 0; width: ${WIDTH}px; height: ${HEIGHT}px; background: url(${identificationBackground}); background-size: cover;'>
    <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
      <div id="formContainer">
        <div style="display: flex; flex-direction: column; margin-top: 100px; margin-bottom: auto; margin-left: auto; margin-right: auto; justify-content: center; align-items: center;">
          <div style="display: flex; flex-direction: column">
            <label style="color: white; font-family: planer;margin-bottom: 5px;">Nickname:</label>
            <input id="nicknameInput" type="text" name="nameField" style="font-size: 16px; background-color: rgba(0,0,0,0.3); color: white; border: 0; border-bottom: 1px solid #00f7fd;font-family: planer; width: 200px; text-align: center" value="Guest">
          </div>
          <div id="signinButton" style="width: 330px; height: 100px; background: url(${multiplayerButton}); background-size: contain;margin-top: 40px; cursor: pointer"></div>
          <input type="button" style="font-size: 16px; display: none" value="Enter" />
        </div>
      </div
    </div>
    <div id="loadingContainer" style="display: none">
      <p style="color: white; font-family: neuropol;">Connecting...</p>
    </div>
  </div>
`

class IdentificationDOMHandler extends BaseDOMHandler {
  private nicknameInput: HTMLInputElement
  private signinButton: HTMLButtonElement
  private formContainer: HTMLDivElement
  private loadingContainer: HTMLDivElement

  public constructor(scene: Phaser.Scene) {
    super(scene, html)
    this.createDOM()
    this.nicknameInput = this.container?.getChildByID('nicknameInput') as HTMLInputElement
    this.signinButton = this.container?.getChildByID('signinButton') as HTMLButtonElement
    this.formContainer = this.container?.getChildByID('formContainer') as HTMLDivElement
    this.loadingContainer = this.container?.getChildByID('loadingContainer') as HTMLDivElement
  }

  public getNicknameInputValue = (): string => {
    return this.nicknameInput.value
  }

  public hideFormContainer = () => {
    this.formContainer.style.display = 'none'
  }

  public showLoadingContainer = () => {
    this.loadingContainer.style.display = 'block'
  }

  public setSigninButtonOnClick = (evt: () => void): void => {
    this.signinButton.addEventListener('click', evt)
  }
}

export default IdentificationDOMHandler
