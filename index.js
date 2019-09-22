console.log('Initializing Froggins server...')
const FrogginsServer = require('./src')
const Froggins = new FrogginsServer()

console.log('=====INITIAL START=====')
Froggins.start()

let looping = false

const debugStop = () => {
  console.log('======STOPPING======')
  Froggins.stop()
  if (!looping) setInterval(() => debugStop(), 40000)
}

const debugStart = () => {
  console.log('======STARTING======')
  Froggins.start()
  if (!looping) setInterval(() => debugStart(), 40000)
}

setTimeout(() => { debugStop(); setTimeout(() => { debugStart(); looping = true }, 20000) }, 20000)
