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

  addPlayer (playerUsername, player) {
    this.set(playerUsername, player)
    this.forEach(player => {
      if (player.uuid !== playerUsername) {
        this.server.ribbitSend(player, {
          type: 'set',
          id: 'server.connectedPlayers',
          value: [...this.keys()]
        })
      }
    })
    console.log(`[+] Added ${playerUsername} to PlayerManager`)
  }

  removePlayer (playerUsername) {
    this.delete(playerUsername)
    this.forEach(player => {
      this.server.ribbitSend(player, {
        type: 'set',
        id: 'server.connectedPlayers',
        value: [...this.keys()]
      })
    })
    console.log(`[-] Removed ${playerUsername} from PlayerManager`)
  }
}

module.exports = PlayerManager
