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

// handle unique join and dropped connections
osc.on('open', () => {
  // handle raw connection events
  plugin.socket.on('connection', (ws) => {
    // handle join event
    // (store the connection so we can know which player is associated with it)
    const joinId = osc.on('/join', message => {
      game.handleJoin(message, ws);
      osc.off('/join', joinId);
    });

    ws.on('close', () => {
      game.handleDrop(ws);
    });
  });
});

// handle normal events
osc.on('/leave', message => {
  game.handleLeave(message);
});

osc.open();
