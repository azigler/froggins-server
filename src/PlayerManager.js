require('dotenv').config()
const Ribbit = require('../ribbit/ribbit')

class PlayerManager extends Map {
  constructor (server) {
    super()
    this.server = server
    this.server.on('start', () => {
      console.log('Starting PlayerManager...')
    })
    this.server.on('stop', () => {
      console.log('Stopping PlayerManager...')
    })
  }

  addPlayer (playerUuid, player) {
    this.set(playerUuid, player)
    this.forEach(player => {
      Ribbit.send(this, player, {
        id: 'report-connected-players',
        value: [...this.keys()]
      })
    })
    console.log(`Added ${playerUuid} to PlayerManager!`)
  }

  removePlayer (playerUuid) {
    this.delete(playerUuid)
    this.forEach(player => {
      Ribbit.send(this, player, {
        id: 'report-connected-players',
        value: [...this.keys()]
      })
    })
    console.log(`Removed ${playerUuid} from PlayerManager!`)
  }
}

module.exports = PlayerManager
