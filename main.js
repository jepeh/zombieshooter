import { GAME } from './app/script.js'
import { Profile } from './profiles/profile.js'
import * as Utils from './app/utils.js'

//GAME.startGame(Profile.level)

$("#playbtn").on(' click ', () => {
	Utils.isEnergy() !== !true ? GAME.startAnim(Profile.level) : Utils.notEnergy()
});