import OSC from "osc-js";
import * as readline from "node:readline";

const port = process.env.PORT || 8910;

const plugin = new OSC.WebsocketClientPlugin({
    port: port,
});
const osc = new OSC({ plugin: plugin })

osc.on('open', () => {

    if (process.argv[2] === "join") {
        osc.send(new OSC.Message('/join', process.argv[3], process.argv[4]));
    }

    if (process.argv[2] === "leave") {
        osc.send(new OSC.Message('/leave', process.argv[3]));
    }
});

osc.open();

// Start a REPL loop for custom OSC messages
const rl = readline.createInterface({
input: process.stdin,
output: process.stdout,
prompt: 'OSC> '
});

rl.prompt();

rl.on('line', (line) => {
    const parts = line.trim().split(' ');
    const address = parts[0];
    const args = parts.slice(1);

    if (!address.startsWith('/')) {
        console.log('Invalid address. OSC addresses must start with "/".');
    } else {
        const message = new OSC.Message(address, ...args);
        osc.send(message);
        console.log(`Sent OSC message to ${address} with arguments: ${args}`);
    }

    rl.prompt();
}).on('close', () => {
    console.log('Exiting REPL.');
    process.exit(0);
});