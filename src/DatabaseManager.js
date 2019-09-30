require('dotenv').config()
const PouchDB = require('pouchdb')

class DatabaseManager extends Map {
  constructor (server) {
    super()
    this.server = server

    this.server.on('start', () => {
      console.log('Starting DatabaseManager...')

      const dbs = [
        'state',
        'user'
      ]
      for (const db of dbs) {
        this.set(db, this.loadDb(db))
      }

      this.server.$state = this.server.managers.get('DatabaseManager').get('state').local
      this.server.$user = this.server.managers.get('DatabaseManager').get('user').local
    })

    this.server.on('stop', () => {
      console.log('Stopping DatabaseManager...')
      this.stopSyncing()
    })
  }

  loadDb (name) {
    const local = new PouchDB(`local/${name}`)
    const remote = new PouchDB(`http://${process.env.COUCHDB_USERNAME}:${process.env.COUCHDB_PASSWORD}@localhost:5984/${name}`)
    console.log(`[=] Syncing ${name} database...`)
    const sync = local.sync(remote, {
      live: true,
      retry: true
    })
    sync.on('complete', () => {
      console.log(`[x] Stopped syncing ${name} database!`)
    })
    sync.on('change', function (change) {
      console.log(`[>] Data change in local ${name} database:`, change)
    })
    return {
      sync,
      remote,
      local
    }
  }

  initializeDocument ({ db, doc, payload }) {
    console.log(`[$] Initialized ${doc} document in remote ${db} database:`, payload)
    this.get(db).remote.put({ _id: doc, ...payload })
  }

  stopSyncing () {
    this.forEach((db) => {
      db.sync.cancel()
    })
  }
}

module.exports = DatabaseManager
