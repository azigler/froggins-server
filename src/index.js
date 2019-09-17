const moment = require('moment')

const DatabaseManager = require('./DatabaseManager')
const PlayerManager = require('./PlayerManager')
const WebSocketManager = require('./WebSocketManager')

class FrogginsServer extends require('events') {
  constructor () {
    super()

    this.managers = new Map([
      ['DatabaseManager', new DatabaseManager(this)],
      ['PlayerManager', new PlayerManager(this)],
      ['WebSocketManager', new WebSocketManager({ server: this })]
    ])

    this.on('start', () => {
      console.log('Starting Froggins!')
      this.startTime = moment().format()
      this.secondsPerLoop = 30
      this.gameLoop = false
      this.$state = this.managers.get('DatabaseManager').get('state').local
      this.gameLoop = setInterval(this.loop.bind(this), this.secondsPerLoop * 1000)
    })

    this.on('stop', () => {
      console.log('Stopping Froggins!')
      clearTimeout(this.gameLoop)
      this.gameLoop = false
    })
  }

  loop () {
    console.log('[#] looping @ ', moment().format())
  }

  start () {
    this.emit('start')
  }

  stop () {
    this.emit('stop')
  }
}

module.exports = FrogginsServer
