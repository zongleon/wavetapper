import OSC from "osc-js";

class Game {
    /**
     * Initialize game object.
     * @param {OSC} osc 
     */
    constructor(osc) {
        this.osc = osc;
        this.players = new Map();
        this.conductor = null;
    }

    /**
     * Handles a player joining the game.
     * @param {OSC.Message} message - The arguments of the OSC message.
     */
    handleJoin(message) {
        let args = message.args;
        if (args.length == 2) {
            const playerId = args[0];
            const playerPos = args[1];

            if (this.players.has(playerId)) {
                console.log(`Player ID already exists: ${playerId}`);
            } else {
                this.players.set(playerId, { id: playerId, pos: playerPos, setting: 0, pingTime: 0, pongTime: 0});
                
                // broadcast connections
                this.broadcast("players");

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
        if (args.length == 1) {
            const playerId = args[0];

            // delete player from list
            if (this.players.has(playerId)) {
                this.players.delete(playerId);
                
                // broadcast
                this.broadcast("players");

                console.log(`Player left: ${playerId}`);
            } else {
                console.log(`Player ${playerId} has already left.`);
            }
        } else {
            console.log('Invalid leave message: Missing player ID.');
        }
    }

    /**
     * Handle a conductor joining the game.
     * there can only be one.
     * @param {OSC.Message} message - arguments
     * @param {WebSocket} ws - the connection
     */
    conductorJoin(message, ws) {
        this.conductor = ws;
        this.connections.set('conductor', ws);
    }

    /**
     * Handl e conductor leaving the game.
     */
    conductorLeave() {
        this.conductor = null;
        this.connections.delete('conductor');
    }

    /**
     * Handle setting update.
     * @param {OSC.Message} message - The arguments of the OSC message.
     */
    handleUpdate(message) {
        let args = message.args;
        if (args.length == 2) {
            const playerId = args[0];
            const setting = args[1];

            let cur = this.players.get(playerId);
            cur.setting = Number(setting);
            this.players.set(playerId, cur);
        }
    }

    /**
     * Handle pong response from player.
     * @param {number} playerPos
     */
    handlePong(playerPos) {
        for (const [id, player] of this.players.entries()) {
            if (playerPos === player.pos) {
                player.pongTime = Date.now();
                this.players.set(id, player);
                break;
            }
        }
    }

    /**
     * Send ping to all players.
     */
    sendPings() {
        const now = Date.now();
        for (const [playerId, player] of this.players.entries()) {
            this.osc.send(new OSC.Message(`/ping/${player.pos}`, 1));
            player.pingTime = now;
            this.players.set(playerId, player);
        }
    }

    /**
     * Check for timeouts.
     * If pongTime is not updated after pingTime within 5 seconds, remove player.
     * Handles players who never send a pong.
     */
    checkTimeouts() {
        for (const [playerId, player] of this.players.entries()) {
            // If player never sent a pong or pongTime < pingTime, and timeout exceeded
            if (
                player.pingTime > 0 &&
                (!player.pongTime || player.pongTime < player.pingTime)
            ) {
                console.log(`Player ${playerId} timed out.`);
                this.handleLeave(new OSC.Message("/player/leave", playerId));
            }
        }
    }

    /**
     * Send updated info to all players
     */
    broadcast(type) {
        if (type == "players") {
            console.log("broadcasting players");
            const playerMap = JSON.stringify([...this.players.values()]);
            this.osc.send(new OSC.Message('/players', playerMap));
        } else if (type == "start") {
            this.osc.send(new OSC.Message('/start', 1));
        }
    }
}

export default Game;

