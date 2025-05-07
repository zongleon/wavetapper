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
    time: new Date().toISOString(),
    hasConductor: game.conductor != null,
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
  game.conductorJoin();
});

// handle normal events
osc.on('/player/leave', message => {
  game.handleLeave(message);
});

osc.on('/player/setting', message => {
  game.handleUpdate(message);
  osc.send(new OSC.Message("/setting", message.args[0], message.args[1]));
});

osc.on('/player/volume', message => {
  osc.send(new OSC.Message("/volume", message.args[0], message.args[1]));
});

osc.on('/player/pan', message => {
  osc.send(new OSC.Message("/pan", message.args[0], message.args[1]));
});

osc.on('/player/tap', message => {
  osc.send(new OSC.Message("/tap", message.args[0]));
});

osc.on('/conductor/section', message => {
  if (message.args[0] == game.conductor) {
    console.log(message.args[1]);
    osc.send(new OSC.Message("/enabled", message.args[1]));
  }
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
  }, 1000);
}, 5000);

osc.open();

// setInterval(() => {
//   console.log(game.players);
// }, 5000);