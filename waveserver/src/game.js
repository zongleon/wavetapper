import OSC from "osc-js";

class Game {
    /**
     * Initialize game object.
     * @param {OSC} osc 
     */
    constructor(osc) {
        this.osc = osc;
        this.players = new Map();
        this.connections = new Map();
    }

    /**
     * Handles a player joining the game.
     * @param {OSC.Message} message - The arguments of the OSC message.
     */
    handleJoin(message, ws) {
        let args = message.args;
        if (args.length == 2) {
            const playerId = args[0];
            const playerPos = args[1]; 

            if (this.players.has(playerId)) {
                console.log(`Player ID already exists: ${playerId}`);
            } else {
                this.players.set(playerId, { id: playerId, pos: playerPos });
                this.connections.set(playerId, ws);

                // broadcast connections
                this.broadcastPlayers();

                console.log(`Player joined: ${playerId}`);
            }
        } else {
            console.log('Invalid join message: Missing player ID (s) or pos (i).');
        }
    }

    /**
     * Handles a player leaving the game.
     * @param {OSC.Message} message - The arguments of the OSC message.
     */
    handleLeave(message) {
        let args = message.args;
        if (args.length > 0) {
            const playerId = args[0];

            if (this.players.has(playerId)) {
                this.players.delete(playerId);

                // broadcast
                this.broadcastPlayers();

                console.log(`Player left: ${playerId}`);
            } else {
                console.log(`Player ${playerId} has already left.`);
            }
        } else {
            console.log('Invalid leave message: Missing player ID.');
        }
    }

    /**
     * Handle dropped connection.
     */
    handleDrop(ws) {
        for (const [playerId, conn] of this.connections.entries()) {
            if (conn === ws) {
                this.connections.delete(playerId);
                this.handleLeave(new OSC.Message('/leave', playerId));
            }
        }
    }
    
    /**
     * Send updated player map to all clients
     */
    broadcastPlayers() {
        const playerMap = JSON.stringify([...this.players.values()]);
        this.osc.send(new OSC.Message('/players', playerMap));
    }
}

export default Game;

