require('dotenv').config()
const Player = require('./Player')

class WebSocketManager extends require('ws').Server {
  constructor ({ server, port = process.env.WEBSOCKET_PORT }) {
    super({ port })
    this.server = server

    // when server is started
    this.server.on('start', () => {
      console.log('Starting WebSocketManager...')
      this.removeAllListeners('connection')
      this.clients.forEach(connection => {
        connection.close()
      })

      // handle connection
      this.on('connection', connection => {
        const player = new Player(this.server, connection)

        console.log(`== ${player.uuid} connected from ${player.ipAddress} ==`)

        // send server status to client
        this.server.ribbitSend(player, {
          id: 'server.online',
          // no type
          value: true
        })

        // send initial Ribbits to client
        this.server.ribbitSend(player, {
          id: 'player.uuid',
          type: 'set',
          value: player.uuid
        })
        this.server.ribbitSend(player, {
          id: 'server.connectedPlayers',
          type: 'set',
          value: [...server.managers.get('PlayerManager').keys()]
        })

        player.socket.on('close', () => {
          this.server.managers.get('PlayerManager').removePlayer(player.uuid)
        })

        player.socket.on('message', message => {
          const data = JSON.parse(message)

          switch (data.type) {
            case 'add-handler': {
              player.handlers.set(data.id, require(`../lib/${data.id}`))
              player.handlers.get(data.id).init(this.server, player)
              break
            }
            case 'remove-handler': {
              player.handlers.delete(data.id)
              break
            }
          }

          // handle message via player handlers
          if (data.handler && player.handlers.get(data.handler)) {
            player.handlers.get(data.handler).handle(this.server, player, data)
          }
        })
      })

      // when server is stopped
      this.server.on('stop', () => {
        console.log('Stopping WebSocketManager...')
        this.removeAllListeners('connection')
        this.clients.forEach(connection => {
          connection.close()
        })

        // handle connection
        this.on('connection', connection => {
          console.log(`Someone tried to connect from ${connection._socket.remoteAddress} while the server was stopped!`)

          // send server status to client
          this.server.ribbitSend({ socket: connection }, {
            id: 'server-online',
            // no type
            value: false
          })
        })
      })
    })
  }
}

module.exports = WebSocketManager
