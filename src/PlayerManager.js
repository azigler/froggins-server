require('dotenv').config()

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
      if (player.uuid !== playerUuid) {
        this.server.ribbitSend(player, {
          id: 'server.connectedPlayers',
          type: 'set',
          value: [...this.keys()]
        })
      }
    })
    console.log(`Added ${playerUuid} to PlayerManager!`)
  }

  removePlayer (playerUuid) {
    this.delete(playerUuid)
    this.forEach(player => {
      this.server.ribbitSend(player, {
        id: 'server.connectedPlayers',
        type: 'set',
        value: [...this.keys()]
      })
    })
    console.log(`Removed ${playerUuid} from PlayerManager!`)
  }
}

module.exports = PlayerManager
