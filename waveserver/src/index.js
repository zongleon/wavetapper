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
  setInterval(() => {
    console.log(game.players, Array.from(game.connections.keys()));
  }, 5000);

  // handle raw connection events
  plugin.socket.on('connection', (ws) => {
    // handle join event
    console.log("ws connection open");
    // (store the connection so we can know which player is associated with it)
    const joinId = osc.on('/join', message => {
      game.handleJoin(message, ws);
      osc.off('/join', joinId);
    });

    const viewId = osc.on('/viewing', message => {
      game.broadcastPlayers();
      osc.off('/join', joinId);
      osc.off('/viewing', viewId);
    });

    ws.on('close', () => {
      console.log("ws connection close");
      game.handleDrop(ws);
      osc.off('/join', joinId);
      osc.off('/viewing', viewId);
    });
  });
});

// // handle normal events
osc.on('/leave', message => {
  game.handleLeave(message);
});

osc.on('/setting', message => {
  game.handleUpdate(message);
});

osc.open();
