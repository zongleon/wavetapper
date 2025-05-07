import OSC from "osc-js";

const port = 8910;

let me: number | null = null;

// start connection
const osc = initConnection();

function initConnection(): OSC {
  // open ws connection
  const plugin = new OSC.WebsocketClientPlugin({ port: port });
  const osc = new OSC({ discardLateMessages: true, plugin: plugin });

  osc.on("open", () => {
    osc.send(new OSC.Message("/conduct", 1));
  });

  let listenid = osc.on("/conductor/id", (message: OSC.Message) => {
    me = message.args[0] as number;
    osc.off("/conductor/id", listenid);

    osc.on(`/ping/${me}`, (_: OSC.Message) => {
      document.getElementById("title")!.innerHTML = `Conductor ${me}`;
      osc.send(new OSC.Message(`/pong/${me}`, 1));
    });

  });

  osc.open();

  return osc;
}

// 16 checkboxes
const checkboxes = document.querySelectorAll("input[type='checkbox']") as NodeListOf<HTMLInputElement>;
// sort by checkbox id
const checkboxArray = Array.from(checkboxes);

// when send-update button is clicked, send /conductor/section
const sendUpdateButton = document.getElementById("send-update") as HTMLButtonElement;
sendUpdateButton.addEventListener("click", () => {
  const checked = checkboxArray.map((checkbox) => checkbox.checked ? 1 : 0);
  const message = new OSC.Message("/conductor/section", me, JSON.stringify(checked));
  console.log(JSON.stringify(checked));
  osc.send(message);
});
