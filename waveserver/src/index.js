// src/index.js
import Game from './game.js';
import express from 'express';
import OSC from 'osc-js';

const app = express();
const port = process.env.PORT || 8910;

// Create HTTP server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const plugin = new OSC.WebsocketServerPlugin({ server: server });
const osc = new OSC({ plugin: plugin });

// Initialize the game
const game = new Game(osc);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: plugin.socket.clients.size,
    time: new Date().toISOString()
  });
});

// handle different player joins
osc.on('/join', message => {
  game.handleJoin(message);
});

osc.on('/viewing', _ => {
  game.broadcast("players");
});

osc.on('/conduct', message => {
  game.conductorJoin(message, ws);
});

// handle normal events
osc.on('/player/leave', message => {
  game.handleLeave(message);
});

osc.on('/player/setting', message => {
  game.handleUpdate(message);
});

osc.on('/conductor/start', message => {
  game.broadcast("start");
});

// Heartbeat: listen for pong
osc.on("/pong/*", (message) => {
  // message.address is like /pong/3, extract pos
  const player = parseInt(message.address.split("/")[2]);
  game.handlePong(player);
});

// Heartbeat: send pings every 5 seconds
setInterval(() => {
  game.sendPings();

  setTimeout(() => {
    game.checkTimeouts();
  }, 2000);
}, 5000);

osc.open();

setInterval(() => {
  console.log(game.players);
}, 5000);