const moment = require('moment')
const DatabaseManager = require('./DatabaseManager')
const PlayerManager = require('./PlayerManager')
const WebSocketManager = require('./WebSocketManager')

class FrogginsServer extends require('events') {
  constructor () {
    super()

    this.on('start', () => {
      console.log('Starting Froggins!')
      this.startTime = moment().format()
      this.secondsPerLoop = 30
      this.gameLoop = setInterval(this.loop.bind(this), this.secondsPerLoop * 1000)
    })

    this.on('stop', () => {
      console.log('Stopping Froggins!')
      clearTimeout(this.gameLoop)
      this.gameLoop = false
    })

    this.ribbitSend = function (player, message) {
      const data = {
        timestamp: moment().format(),
        ...message
      }
      player.socket.send(JSON.stringify(data))
    }

    this.ribbitSendAll = function (message) {
      const data = {
        timestamp: moment().format(),
        ...message
      }
      this.managers.get('PlayerManager').forEach(player => {
        player.socket.send(JSON.stringify(data))
      })
    }

    this.managers = new Map([
      ['DatabaseManager', new DatabaseManager(this)],
      ['PlayerManager', new PlayerManager(this)],
      ['WebSocketManager', new WebSocketManager({ server: this })]
    ])
  }

  loop () {
    console.log('[#] Looping @', moment().format())
  }

  start () {
    this.emit('start')
  }

  stop () {
    this.emit('stop')
  }
}

module.exports = FrogginsServer
