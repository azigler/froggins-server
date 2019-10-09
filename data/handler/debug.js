module.exports = {
  setUp: (server, player) => {
    server.$state.get('debug').then(state => {
      server.ribbitSend(player, {
        type: 'set',
        id: 'debug',
        value: state
      })
    })
    // check for remote data
    server.managers.get('DatabaseManager').get('state').remote.get('debug').catch(() => {
      server.managers.get('DatabaseManager').initializeDocument({ db: 'state', doc: 'debug', payload: { _id: 'debug', clicks: 0 } })
    })
  },

  handle: (server, player, data) => {
    if (data.handler !== 'debug') {
      return
    }

    switch (data.id) {
      case 'incrementClicks': {
        server.$state.get('debug').then(state => {
          state.clicks++
          console.log(`Clicks incremented to: ${state.clicks}`)
          server.ribbitSendAll({
            type: 'set',
            id: 'debug.clicks',
            value: state.clicks
          })
          return server.$state.put(state)
        }).catch(() => server.managers.get('DatabaseManager').initializeDocument({ db: 'state', doc: 'debug', payload: { _id: 'debug', clicks: 0 } }))
        break
      }
      case 'fetchClicks': {
        server.$state.get('debug').then(state => {
          console.log(`Client fetched server clicks: ${state.clicks}`)
          server.ribbitSend(player, {
            type: 'set',
            id: 'state.clicks',
            value: state.clicks
          })
        }).catch(() => server.managers.get('DatabaseManager').initializeDocument({ db: 'state', doc: 'debug', payload: { _id: 'debug', clicks: 0 } }))
        break
      }
    }
  }
}
