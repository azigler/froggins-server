const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 9998 });

const state = {
  clicks: 0
}

const connected = []

wss.on('connection', function connection(ws) {
  console.log('someone connected');
  connected.push(ws)

  ws.on('message', function incoming(message) {
    const data = JSON.parse(message)
    console.log(data)

    console.log(data.text)
    
    if (data.action === 'incrementClicks') {
      state.clicks++
      console.log(`clicks incremented to: ${state.clicks}`);
      connected.forEach((ws) => { ws.send(state.clicks) });
    }

    if (data.action === 'fetchClicks') {
      console.log(`clicks fetched: ${state.clicks}`);
      ws.send(state.clicks);
    }
  });

  ws.on('close', function disconnection(ws) {
    console.log('someone disconnected')
  });
});
