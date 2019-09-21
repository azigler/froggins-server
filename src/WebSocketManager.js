require('dotenv').config()
const uuidv4 = require('uuid/v4')

class WebSocketManager extends require('ws').Server {
  constructor ({ server, port = process.env.WEBSOCKET_PORT }) {
    super({ port })
    this.server = server

    // TODO: attach to connection Player instance out here, for both started and stopped server modes

    // when server is started
    this.server.on('start', () => {
      console.log('Starting WebSocketManager...')
      this.removeAllListeners('connection')
      this.clients.forEach(connection => {
        connection.close()
      })
      // handle connection
      this.on('connection', connection => {
        // TODO: move UUID generation to Player instance
        const id = uuidv4()
        console.log(`== ${id} connected from ${connection._socket.remoteAddress} ==`)
        // TODO: bind listeners from Ribbit
        this.bindListeners(connection)
        // TODO: attach connection to a Player instance and add to PlayerManager Map
        server.managers.get('PlayerManager').set(id, connection)
        connection.id = id

        // TODO: update all players about new connection via PlayerManager, not here
        this.clients.forEach(connection => {
          this.sendObj(connection, {
            connectedUsers: [...server.managers.get('PlayerManager').keys()]
          })
        })
        // TODO: use Ribbit to send player data back to client
        this.sendObj(connection, {
          label: 'userId',
          userId: id
        })
      })
    })

    // when server is stopped
    this.server.on('stop', () => {
      console.log('Stopping WebSocketManager...')
      this.removeAllListeners('connection')
      this.clients.forEach(connection => {
        connection.close()
      })
      this.on('connection', connection => {
        console.log(`Someone tried to connect from ${connection._socket.remoteAddress} while the server was stopped!`)

        // TODO: use Ribbit to systematically communicate stopped status (not like this!)
        this.sendObj(connection, {
          label: 'userId',
          userId: 'stopped'
        })
        this.sendObj(connection, {
          connectedUsers: ['offline']
        })
      })
    })
  }

  // TODO: move to Ribbit
  bindListeners (connection) {
    connection.on('message', message => {
      const data = JSON.parse(message)

      switch (data.action) {
        case 'incrementClicks': {
          this.server.$state.get('debug').then(state => {
            state.clicks++
            console.log(`Clicks incremented to: ${state.clicks}`)
            this.sendObjToAll(state.clicks)
            return this.server.$state.put(state)
          }).catch(() => this.server.managers.get('DatabaseManager').initializeDocument({ db: 'state', doc: 'debug', payload: { _id: 'debug', clicks: 0 } }))
          break
        }
        case 'fetchClicks': {
          this.server.$state.get('debug').then(state => {
            console.log(`Client fetched server clicks: ${state.clicks}`)
            connection.send(state.clicks)
          }).catch(() => this.server.managers.get('DatabaseManager').initializeDocument({ db: 'state', doc: 'debug', payload: { _id: 'debug', clicks: 0 } }))
          break
        }
      }
    })

    connection.on('close', message => {
      this.server.managers.get('PlayerManager').delete(connection.id)
    })
  }

  // TODO: move to Ribbit
  sendObj (target, payload) {
    target.send(JSON.stringify(payload))
  }

  // TODO: move to Ribbit
  sendObjToAll (payload) {
    this.clients.forEach(connection => {
      connection.send(JSON.stringify(payload))
    })
  }
}

module.exports = WebSocketManager
