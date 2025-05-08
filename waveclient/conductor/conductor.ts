import OSC from "osc-js";
import * as CONSTS from "../src/consts";

let me: number | null = null;

// start connection
const osc = initConnection();

function initConnection(): OSC {
  // open ws connection
  const plugin = new OSC.WebsocketClientPlugin({ host: CONSTS.SERVER_URL, port: CONSTS.PORT, secure: true });
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

// when checkbox is clicked, send /conductor/section
checkboxArray.forEach((checkbox, _) => {
  checkbox.addEventListener("click", () => {
    const checked = checkboxArray.map((checkbox) => checkbox.checked ? 1 : 0);
    const message = new OSC.Message("/conductor/section", me, JSON.stringify(checked));
    osc.send(message);
  });
});

// we have 4 buttons, each will enable a combination of checkboxes
const prechorusbutton = document.getElementById("prechorus") as HTMLButtonElement;
const chorusbutton = document.getElementById("chorus") as HTMLButtonElement;
const breakdownbutton = document.getElementById("breakdown") as HTMLButtonElement;
const prechorusbreakdownbtn = document.getElementById("prechorusbreakdown") as HTMLButtonElement;
const allchorusbutton = document.getElementById("allchorus") as HTMLButtonElement;
const endingbutton = document.getElementById("ending") as HTMLButtonElement;
const silencebutton = document.getElementById("silence") as HTMLButtonElement;

function updateCheckboxes(boxes: number[]) {
  boxes.forEach((value, index) => {
    checkboxArray[index].checked = value === 1;
  });
  const message = new OSC.Message("/conductor/section", me, JSON.stringify(boxes));
  osc.send(message);
}

prechorusbutton.onclick = () => {
  const prechorus = [0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0];
  updateCheckboxes(prechorus);
}

chorusbutton.onclick = () => {
  const chorus = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0];
  updateCheckboxes(chorus);
}

breakdownbutton.onclick = () => {
  const breakdown = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
  updateCheckboxes(breakdown);
}

prechorusbreakdownbtn.onclick = () => {
  const prechorusbreakdown = [0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0];
  updateCheckboxes(prechorusbreakdown);
}

endingbutton.onclick = () => {
  const ending = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0];
  updateCheckboxes(ending);
}

allchorusbutton.onclick = () => {
  const allchorus = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0];
  updateCheckboxes(allchorus);
}



silencebutton.onclick = () => {
  const silence = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  updateCheckboxes(silence);
}
