require('dotenv').config()

class CutsceneManager extends Map {
  constructor (server) {
    super()
    this.server = server
    this.server.on('start', () => {
      console.log('Starting CutsceneManager...')
    })
    this.server.on('stop', () => {
      console.log('Stopping CutsceneManager...')
    })
  }
}

module.exports = CutsceneManager
