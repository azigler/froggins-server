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
}

module.exports = PlayerManager
