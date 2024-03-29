require('dotenv').config()
const Player = require('./Player')
const bcrypt = require('bcrypt')
const saltRounds = 10

class WebSocketManager extends require('ws').Server {
  constructor ({ server, port = process.env.WEBSOCKET_PORT }) {
    if (process.env.NODE_ENV === 'development') {
      super({ port })
    } else {
      const https = require('https')
      const fs = require('fs')
      const privateKey = fs.readFileSync(process.env.PRIVATEKEY_PATH, 'utf8')
      const certificate = fs.readFileSync(process.env.CERTIFICATE_PATH, 'utf8')
      const credentials = { key: privateKey, cert: certificate }

      const httpsServer = https.createServer(credentials)
      httpsServer.listen(5050)
      super({ server: httpsServer })
    }

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
        connection.server = this.server
        // send server status to client
        this.server.ribbitSend({ socket: connection }, {
          type: 'server-status',
          id: 'server.online',
          value: true
        })

        // announce connection
        // TODO: log connection IP and add security (reject lingering/spammy clients)
        console.log(`[!] ${connection._socket.remoteAddress} has connected`)

        // add listener to handle when connection closes
        connection.on('close', () => console.log(`[!] ${connection._socket.remoteAddress} has disconnected`))

        // authenticate the user with named function that can be removed later
        connection.on('message', async function authenticate (message) {
          const data = JSON.parse(message)

          // HANDLE LOGIN
          if (data.id === 'login') {
            const usernameValidation = connection.server.validate({
              label: 'username',
              field: data.username,
              length: 4,
              alphanumeric: true
            })
            const passwordValidation = connection.server.validate({
              label: 'password',
              field: data.password,
              length: 6
            })

            if (usernameValidation !== true || passwordValidation !== true) {
              return connection.server.ribbitSend({ socket: connection }, {
                type: 'invalid-input',
                id: 'reject-login',
                value: 'The input was invalid.'
              })
            }

            // authenticate user credentials
            const loginSuccessful = await connection.server.$user.get(data.username.toLowerCase()).then(user => {
              return bcrypt.compareSync(data.password, user.password)
            }).catch((er) => {
              if (er.status === 404) {
                connection.server.ribbitSend({ socket: connection }, {
                  type: 'wrong-input',
                  id: 'reject-login',
                  value: 'Wrong username or password.'
                })
              } else {
                console.log(`[!] ${connection._socket.remoteAddress} unexpectedly failed to log in:`, er)
                connection.server.ribbitSend({ socket: connection }, {
                  type: 'unexpected-error',
                  id: 'reject-login',
                  value: 'An unexpected error occurred.'
                })
              }
            })

            if (loginSuccessful) {
              // initialize the Player object
              connection.username = data.username
              const player = new Player(connection.server, connection)
              connection.server.managers.get('PlayerManager').addPlayer(player.username, player)

              // notify of login success
              connection.server.ribbitSend({ socket: connection }, {
                id: 'confirm-login'
                // TODO: send initial player data
              })
              console.log(`[%] ${connection._socket.remoteAddress} logged in as: ${data.username}`)

              // remove the authentication listener
              connection.removeEventListener('message', authenticate)
            } else {
              connection.server.ribbitSend({ socket: connection }, {
                type: 'wrong-input',
                id: 'reject-login',
                value: 'Wrong username or password.'
              })
            }

          // HANDLE REGISTRATION
          } if (data.id === 'registration') {
            const usernameValidation = connection.server.validate({
              label: 'username',
              field: data.username,
              length: 4,
              alphanumeric: true
            })
            const passwordValidation = connection.server.validate({
              label: 'password',
              field: data.password,
              length: 6
            })

            if (usernameValidation !== true || passwordValidation !== true) {
              return connection.server.ribbitSend({ socket: connection }, {
                type: 'invalid-input',
                id: 'reject-registration',
                value: 'The input was invalid.'
              })
            }

            // check if username is taken
            await connection.server.$user.get(data.username.toLowerCase()).then(() => {
              connection.server.ribbitSend({ socket: connection }, {
                type: 'username-taken',
                id: 'reject-registration',
                value: 'That username is already taken.'
              })
              console.log(`[!] ${connection._socket.remoteAddress} attempted to register a taken username: ${data.username}`)
            }).catch((er) => {
              // if a user entry is not found with that username
              if (er.message === 'missing') {
                // hash the password before storing
                const passwordHash = bcrypt.hashSync(data.password, saltRounds)

                // add the new player registration to the user database
                connection.server.managers.get('DatabaseManager').initializeDocument({
                  db: 'user',
                  doc: data.username.toLowerCase(),
                  payload: {
                    username: data.username,
                    password: passwordHash
                  }
                })

                // initialize the Player object
                connection.username = data.username
                const player = new Player(connection.server, connection)
                connection.server.managers.get('PlayerManager').addPlayer(player.username, player)

                // notify of registration success
                connection.server.ribbitSend({ socket: connection }, {
                  id: 'confirm-registration'
                  // TODO: send initial player data
                })

                console.log(`[%] ${connection._socket.remoteAddress} registered a new account as: ${data.username}`)
              }
            })
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
          console.log(`[!] ${connection._socket.remoteAddress} attempted to connect while server is stopped`)

          // send server status to client
          this.server.ribbitSend({ socket: connection }, {
            type: 'server-status',
            id: 'server.online',
            value: false
          })
        })
      })
    })
  }
}

module.exports = WebSocketManager
