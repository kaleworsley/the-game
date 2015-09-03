import http from 'http'
import ws from 'ws'
import fs from 'fs'

import Game from './lib/game'

const PORT = 8080

var app = http.createServer(handler)
var wss = new ws.Server({server: app})

app.listen(PORT)

console.log('Running on port ' + PORT)

function handler (req, res) {
  var path = '/' + (req.url.replace(/^\//, '') || 'index.html')
  fs.readFile(__dirname + path, function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading ' + path);
    }

    res.writeHead(200);
    res.end(data);
  });
}

const timeStepInMs = 20

var game = new Game()

setInterval(function() {
  game.tick(timeStepInMs / 1000)
  game.ships.forEach(function(ship) {
    ship.client.send(JSON.stringify({"state": game.state}))
  })
}, timeStepInMs)

setInterval(function(){
  console.log(game.state)
}, 1000)

wss.on('connection', function (client) {
  console.log('Connection registered')

  let ship = game.addShip(client)

  client.on('message', function (message) {
    let state = JSON.parse(message).inputState

    ship.thrusting = state.thrust
    ship.left = state.left
    ship.right = state.right
  });

  client.on('close', function() {
    game.removeShip(ship)
    console.log('Connection closed')
  })
});
