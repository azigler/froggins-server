require('dotenv').config()
const PouchDB = require('pouchdb')

class DatabaseManager extends Map {
  constructor (server) {
    super()
    this.server = server
  }

  start () {
    console.log('Starting DatabaseManager...')
    const dbs = [
      'state'
    ]

    for (const db of dbs) {
      this.set(db, this.loadDb(db))
    }

    // check for remote data
    this.get('state').remote.get('debug').catch(() => {
      // CONVERT THIS OBJECT TO YAML FILE
      this.initializeDocument({ db: 'state', doc: 'debug', payload: { _id: 'debug', clicks: 0 } })
    })
  }

  stop () {
    console.log('Stopping DatabaseManager...')
    this.stopSyncing()
  }

  loadDb (name) {
    const local = new PouchDB(`local/${name}`)
    const remote = new PouchDB(`http://${process.env.COUCHDB_USERNAME}:${process.env.COUCHDB_PASSWORD}@localhost:5984/${name}`)
    console.log(`Syncing ${name} database...`)
    const sync = local.sync(remote, {
      live: true,
      retry: true
    })
    sync.on('complete', () => {
      console.log(`Stopped syncing ${name} database!`)
    })
    sync.on('change', function (change) {
      console.log(`[#] Data change in ${name} database:`, change)
    })
    return {
      sync,
      remote,
      local
    }
  }

  initializeDocument ({ db, doc, payload }) {
    console.log(`No remote ${db} found, initializing ${doc} state!`)
    this.get(db).remote.put({ _id: doc, ...payload })
  }

  stopSyncing () {
    this.forEach((db) => {
      db.sync.cancel()
    })
  }
}

module.exports = DatabaseManager
