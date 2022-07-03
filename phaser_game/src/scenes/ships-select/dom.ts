import { HEIGHT, WIDTH } from 'utils/constants'
import BaseDOMHandler from 'utils/dom'
import backgroundImage from 'assets/ships-select-background.png'
import titleImage from 'assets/ships-select-title.png'
import shipSelectFrameImage from 'assets/ship_select_frame.png'
import spaceshipArrowImage from 'assets/spaceship-select-arrow.png'
import blue1Image from 'assets/blue-1.png'
import red1Image from 'assets/red-1.png'
import levelOnImage from 'assets/level-on.png'
import levelOffImage from 'assets/level-off.png'
import armoryItem1Image from 'assets/armory-item-1.png'
import buttonBackground from 'assets/button-background.png'

const html = (isChallenger: boolean) => `
  <div id="backDiv" style='position: absolute; left: 0; top: 0; width: ${WIDTH}px; height: ${HEIGHT}px; background: url(${backgroundImage}); background-size: cover;'>
    <div style="display: flex; height: 100%; flex-direction: column">
      <img src="${titleImage}" style="width: 280px; object-fit: contain; margin-left: auto; margin-right: auto; margin-top: 10px" />
      <span style="font-family: neuropol; color: white;position: absolute; right: 50px; top: 22px" id="timer">15</span>
      <div style="width: 100%;display: flex; flex-direction: column">
        <div style="background-color: rgba(0,0,0,0.58); width: 100%; border: solid 3px #0a3138; border-left: 0; border-right: 0; margin-top: 10px; padding: 10px 0; display: flex; flex-direction: row">
          <div style="display: flex; margin-left: 20px;">
            <img src="${spaceshipArrowImage}" style="transform: rotate(180deg); width: 25px; object-fit: contain;" />
            <div style="background-image: url(${shipSelectFrameImage}); background-size: contain; background-repeat: no-repeat; margin: 0px 10px">
              <img src="${
                isChallenger ? red1Image : blue1Image
              }" style="width: 40px; object-fit: contain; margin: 10px 60px 0px 60px;" />
            </div>
            <img src="${spaceshipArrowImage}" style="width: 25px; object-fit: contain;" />
          </div>
          <div style="display: flex; flex-direction: row; color: white; font-family: neuropol; margin-left: 50px;">
            <div style="display: flex; flex-direction: column;justify-content: space-between">
              <span>Name:</span>
              <span>Speed:</span>
              <span>Shield:</span>
            </div>
            <div style="display: flex; flex-direction: column;flex: 1; justify-content: space-between; margin-left: 20px">
              <span>Spaceship 1</span>
              <div style="display: flex; flex-direction: row">
                <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOffImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOffImage}" style="width: 18px; height: 18px;"/>
              </div>
              <div style="display: flex; flex-direction: row">
                <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOffImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOffImage}" style="width: 18px; height: 18px;"/>
              </div>
            </div> 
          </div>
          <div style="flex: 1; display: flex; justify-content: center;flex-direction: column">
            <span style="font-family: neuropol; color: white; text-align: center">ARMORY</span>
            <div style="display: flex; align-items: center; justify-content: center;  margin-top: 10px;">
              <img src="${armoryItem1Image}" style="width: 30px; height: 30px; object-fit: contain" />
            </div>
          </div>
        </div>

        <div style="background-color: rgba(0,0,0,0.58); width: 100%; border: solid 3px #0a3138; border-left: 0; border-right: 0; margin-top: 10px; padding: 10px 0; display: flex; flex-direction: row">
        <div style="display: flex; margin-left: 20px;">
          <img src="${spaceshipArrowImage}" style="transform: rotate(180deg); width: 25px; object-fit: contain;" />
          <div style="background-image: url(${shipSelectFrameImage}); background-size: contain; background-repeat: no-repeat; margin: 0px 10px">
            <img src="${
              isChallenger ? red1Image : blue1Image
            }" style="width: 40px; object-fit: contain; margin: 10px 60px 0px 60px;" />
          </div>
          <img src="${spaceshipArrowImage}" style="width: 25px; object-fit: contain;" />
        </div>
        <div style="display: flex; flex-direction: row; color: white; font-family: neuropol; margin-left: 50px;">
          <div style="display: flex; flex-direction: column;justify-content: space-between">
            <span>Name:</span>
            <span>Speed:</span>
            <span>Shield:</span>
          </div>
          <div style="display: flex; flex-direction: column;flex: 1; justify-content: space-between; margin-left: 20px">
            <span>Spaceship 1</span>
            <div style="display: flex; flex-direction: row">
              <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
              <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
              <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
              <img src="${levelOffImage}" style="width: 18px; height: 18px;"/>
              <img src="${levelOffImage}" style="width: 18px; height: 18px;"/>
            </div>
            <div style="display: flex; flex-direction: row">
              <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
              <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
              <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
              <img src="${levelOffImage}" style="width: 18px; height: 18px;"/>
              <img src="${levelOffImage}" style="width: 18px; height: 18px;"/>
            </div>
          </div> 
        </div>
        <div style="flex: 1; display: flex; justify-content: center;flex-direction: column">
          <span style="font-family: neuropol; color: white; text-align: center">ARMORY</span>
          <div style="display: flex; align-items: center; justify-content: center;  margin-top: 10px;">
            <img src="${armoryItem1Image}" style="width: 30px; height: 30px; object-fit: contain" />
          </div>
        </div>
      </div>

      <div style="background-color: rgba(0,0,0,0.58); width: 100%; border: solid 3px #0a3138; border-left: 0; border-right: 0; margin-top: 10px; padding: 10px 0; display: flex; flex-direction: row">
          <div style="display: flex; margin-left: 20px;">
            <img src="${spaceshipArrowImage}" style="transform: rotate(180deg); width: 25px; object-fit: contain;" />
            <div style="background-image: url(${shipSelectFrameImage}); background-size: contain; background-repeat: no-repeat; margin: 0px 10px">
              <img src="${
                isChallenger ? red1Image : blue1Image
              }" style="width: 40px; object-fit: contain; margin: 10px 60px 0px 60px;" />
            </div>
            <img src="${spaceshipArrowImage}" style="width: 25px; object-fit: contain;" />
          </div>
          <div style="display: flex; flex-direction: row; color: white; font-family: neuropol; margin-left: 50px;">
            <div style="display: flex; flex-direction: column;justify-content: space-between">
              <span>Name:</span>
              <span>Speed:</span>
              <span>Shield:</span>
            </div>
            <div style="display: flex; flex-direction: column;flex: 1; justify-content: space-between; margin-left: 20px">
              <span>Spaceship 1</span>
              <div style="display: flex; flex-direction: row">
                <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOffImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOffImage}" style="width: 18px; height: 18px;"/>
              </div>
              <div style="display: flex; flex-direction: row">
                <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOnImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOffImage}" style="width: 18px; height: 18px;"/>
                <img src="${levelOffImage}" style="width: 18px; height: 18px;"/>
              </div>
            </div> 
          </div>
          <div style="flex: 1; display: flex; justify-content: center;flex-direction: column">
            <span style="font-family: neuropol; color: white; text-align: center">ARMORY</span>
            <div style="display: flex; align-items: center; justify-content: center;  margin-top: 10px;">
              <img src="${armoryItem1Image}" style="width: 30px; height: 30px; object-fit: contain" />
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin: 15px 15px 0 15px">
          <div style="display: flex; color: white; font-family: neuropol; align-items: center; justify-content: center; font-size: 12px;position: relative; padding: 0 17px; cursor: pointer" id="giveUpButton">
            GIVE UP
            <img src="${buttonBackground}" style="object-fit: contain; z-index: 0; position: absolute; width: 100%" />
          </div>
          <div style="position: absolute;left: 0;top: 59px;background-color: rgba(0,0,0,0.6);width: 100%;height: 278px;"></div>
          <div style="position: absolute;color: white;width: 300px;font-size: 16px;background-color: rgba(0,0,0,1);border: 5px solid white;border-radius: 5px 0px 5px 0px;padding: 20px;right: 50%;font-family: 'planer';bottom: 50%;transform: translate(50%, 50%);">
          There's no other spaceship/armory option available now, please press done to continue
          </div>
          <div style="display: flex; color: white; font-family: neuropol; align-items: center; justify-content: center; font-size: 12px;position: relative; padding: 0 27px; cursor: pointer" id="doneButton">
            DONE
            <img src="${buttonBackground}" style="object-fit: contain; z-index: 0; position: absolute; width: 100%" />
          </div>
          <span id="waitingOponentSpan" style="display: none; color: white; font-family: neuropol; align-items: center; justify-content: center; font-size: 12px;position: relative; padding: 0 27px; cursor: pointer" id="doneButton">
            WAITING OPONENT
          </span>
        </div>

      </div>
    </div>
  </div>
`

class ShipsSelectDOMHandler extends BaseDOMHandler {
  private timerSpan: HTMLSpanElement
  private waitingOponent: HTMLSpanElement
  private giveUpButton: HTMLDivElement
  private doneButton: HTMLDivElement

  public constructor(scene: Phaser.Scene, isChallenger: boolean) {
    super(scene, html(isChallenger))
    this.createDOM()
    this.timerSpan = document.querySelector('#timer') as HTMLSpanElement
    this.giveUpButton = document.querySelector('#giveUpButton') as HTMLDivElement
    this.doneButton = document.querySelector('#doneButton') as HTMLDivElement
    this.waitingOponent = document.querySelector('#waitingOponentSpan') as HTMLSpanElement
    this.startTimer()
  }

  public startTimer() {
    const timerInterval = setInterval(() => {
      if (this.timerSpan) {
        const currentTime = Number(this.timerSpan.innerText)
        if (currentTime) {
          this.timerSpan.innerText = `${currentTime - 1}`
          return
        }
        this.timerSpan.remove()
      }
      clearInterval(timerInterval)
    }, 1000)
  }

  public showWaitingOponent() {
    this.waitingOponent.style.display = 'block'
    this.doneButton.style.display = 'none'
  }

  public showDoneButton() {
    this.waitingOponent.style.display = 'none'
    this.doneButton.style.display = 'block'
  }


  public setGiveUpButtonOnClick(evt: () => void) {
    this.giveUpButton.addEventListener('click', evt)
  }

  public setDoneButtonOnClick(evt: () => void) {
    this.doneButton.addEventListener('click', evt)
  }
}

export default ShipsSelectDOMHandler
