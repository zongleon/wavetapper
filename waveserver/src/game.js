import OSC from "osc-js";

let MOCK_DATA = false;

class Game {
    /**
     * Initialize game object.
     * @param {OSC} osc 
     */
    constructor(osc) {
        this.osc = osc;
        this.players = new Map();
        if (MOCK_DATA) {
            for (let i = 0; i < 16; i++) {
                this.players.set(i, { id: i, pos: i, setting: 0, pingTime: 0, pongTime: 0});
            }
        }
        this.enabled = new Array(16).fill(0);
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

            if (this.players.has(playerPos)) {
                console.log(`Player ID already exists: ${playerPos}`);
            } else {
                this.players.set(playerPos, { id: playerId, pos: playerPos, setting: 0, pingTime: 0, pongTime: 0});
                
                // broadcast connections
                this.broadcast("players");

                console.log(`Player joined: ${playerPos}`);
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
            const playerPos = args[0];

            // delete player from list
            if (this.players.has(playerPos)) {
                this.players.delete(playerPos);
                
                // broadcast
                this.broadcast("players");

                console.log(`Player left: ${playerPos}`);
            } else {
                console.log(`Player ${[playerPos]} has already left.`);
            }
        } else {
            console.log('Invalid leave message: Missing player ID.');
        }
    }

    /**
     * Handle a conductor joining the game.
     * there can only be one.
     */
    conductorJoin() {
        if (this.conductor != null) {
            console.log("Conductor already exists.");
            return;
        }
        this.conductor = Math.round(Math.random() * -10000);
        this.players.set(this.conductor, { id: this.conductor, pos: this.conductor, setting: 0, pingTime: 0, pongTime: 0});
        this.osc.send(new OSC.Message('/conductor/id', this.conductor));
    }


    /**
     * Handle setting update.
     * @param {OSC.Message} message - The arguments of the OSC message.
     */
    handleUpdate(message) {
        let args = message.args;
        if (args.length == 2) {
            const playerPos = args[0];
            const setting = args[1];

            let cur = this.players.get(playerPos);
            cur.setting = Number(setting);
            this.players.set(playerPos, cur);
        }
    }

    /**
     * Handle pong response from player.
     * @param {number} playerPos
     */
    handlePong(playerPos) {
        for (const [pos, player] of this.players.entries()) {
            if (playerPos === pos) {
                player.pongTime = Date.now();
                this.players.set(pos, player);
                break;
            }
        }
    }

    /**
     * Send ping to all players.
     */
    sendPings() {
        const now = Date.now();
        for (const [pos, player] of this.players.entries()) {
            this.osc.send(new OSC.Message(`/ping/${player.pos}`, 1));
            player.pingTime = now;
            this.players.set(pos, player);
        }
    }

    /**
     * Check for timeouts.
     * If pongTime is not updated after pingTime within 5 seconds, remove player.
     * Handles players who never send a pong.
     */
    checkTimeouts() {
        for (const [playerPos, player] of this.players.entries()) {
            // If player never sent a pong or pongTime < pingTime, and timeout exceeded
            if (
                !MOCK_DATA &&
                player.pingTime > 0 &&
                player.pongTime < player.pingTime
            ) {
                if (playerPos == this.conductor) {
                    console.log(`Conductor timed out.`);
                    this.conductor = null;
                }
                console.log(`Player ${playerPos} timed out.`);
                this.handleLeave(new OSC.Message("/player/leave", playerPos));
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
        }
    }
}

export default Game;
