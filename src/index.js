const moment = require('moment')
const DatabaseManager = require('./DatabaseManager')
const PlayerManager = require('./PlayerManager')
const WebSocketManager = require('./WebSocketManager')

/* eslint-disable no-extend-native */
String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

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

    this.validate = function ({ label, field, length = false, alphanumeric = false }) {
      if (field.length === 0) {
        return `No ${label} was provided.`
      }

      if (length !== false && field.length < length) {
        return `${label.capitalize()} is not long enough.`
      }

      if (alphanumeric && /^[a-zA-Z0-9]+$/.test(field) === false) {
        return `${label.capitalize()} contains invalid characters.`
      } else {
        return true
      }
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
