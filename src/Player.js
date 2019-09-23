require('dotenv').config()
const uuidv4 = require('uuid/v4')

class Player {
  constructor (server, connection) {
    this.server = server
    this.socket = connection
    this.uuid = uuidv4()
    this.ipAddress = this.socket._socket.remoteAddress
    this.handlers = new Map()

    console.log(`Initialized player ${this.uuid}!`)
    server.managers.get('PlayerManager').addPlayer(this.uuid, this)
  }
}

module.exports = Player
