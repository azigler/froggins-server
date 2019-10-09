require('dotenv').config()
const uuidv4 = require('uuid/v4')

class Player {
  constructor (server, connection) {
    this.server = server
    this.socket = connection
    this.uuid = uuidv4()
    this.ipAddress = this.socket._socket.remoteAddress
    this.handlers = new Map()
    this.username = connection.username

    console.log(`[@] Player ${this.username} was initialized`)

    this.socket.on('close', () => {
      this.server.managers.get('PlayerManager').removePlayer(this.username)
    })

    this.socket.on('message', message => {
      const data = JSON.parse(message)

      switch (data.type) {
        case 'add-handler': {
          this.handlers.set(data.id, require(`../data/handler/${data.id}`))
          this.handlers.get(data.id).setUp(this.server, this)
          break
        }
        case 'remove-handler': {
          this.handlers.delete(data.id)
          break
        }
      }

      // handle message via handlers
      if (data.handler && this.handlers.get(data.handler)) {
        this.handlers.get(data.handler).handle(this.server, this, data)
      }
    })

    // send initial Ribbits to player's client
    server.ribbitSend(this, {
      type: 'set',
      id: 'player.uuid',
      value: this.uuid
    })
    server.ribbitSend(this, {
      type: 'set',
      id: 'server.connectedPlayers',
      value: [...server.managers.get('PlayerManager').keys()]
    })
  }
}

module.exports = Player
