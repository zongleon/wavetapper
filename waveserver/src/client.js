import OSC from "osc-js";

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

osc.on('/players', message => {
    console.log(message);
}) 

osc.open();