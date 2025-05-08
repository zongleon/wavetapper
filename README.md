# Wavetapper
**AME 196 Final Project by Leon Zong**  
**May 8, 2025**

## Design Process
I designed my piece with inspiration from a piece by Frums with the same name. I was fascinated by the visualization and the way the parts came together, with unique vocal samples. So I wanted to make my own version of this idea, but to add interactivity for lots of people to come together.

I started by designing 14 unique rhythmic parts in **Ableton**. I later added a 2nd version for each part. I wrote a **Chuck** script (waveclient/public/chuck/) to deterministically play a set of tracks ('enabled' tracks). Chuck handles synchronization of all tracks and is embedded in the interface via **WebChuck**. In addition, separate Chuck shreds control additional parameters for each track (panning, volume). 1 of the remaining parts adds reverb and chorus to the master output. The final part purely displays interesting visual patterns.

Regarding visual patterns, I recently was diving into Javascript and front-end web design and so decided to implement the visual component as a website. I used **PixiJS** (a 2D graphics library) to draw each cube's face, and set up a pattern-based way to draw each face. I added animations for bouncing the cubes, but didn't end up making this do anything. I drew most of the patterns based on the ones from Frums' video, but some are unique.

I needed a way for individual players to communicate with the song player and viewer, so I wrote a separate interface for the player (waveclient/player) and viewer (waveclient/viewer) and conductor (waveclient/conductor). In order to make these interfaces connect, I wrote a small **NodeJS** server which acts as a central authority for collecting **OSC** messages (which are how we communicate), managing game state, etc. I wanted this project to be something that would even work outside of class, so this added a bit of complexity.

The server basically keeps track of active players, their setting selections, and broadcasts individual player updates (panning, volume) to all viewers. I used browser **Gyroscope** integration to collect Gyroscope orientations and process them as panning and volume values.

An interesting feature is the way I activate the cube visuals. Since I did my songwriting in Ableton, it would be a hassle to convert the tracks into arrays of activations. Instead, I wrote a general function to **detect transients** as a Chuck SndBuf is being played, and used that to trigger Chuck Events. Since I'm using WebChuck, I am able to interface between my Javascript code and my Chuck code; events are the way this happens. Transient detection events tell my viewer code to 'light up' the faces of the cube.

## Design Structure
In the following description, 'message' always refers to an OSC message.

- Viewer receives messages from the Waveserver, runs the Chuck code, and runs the main visualization  
  - Player setting selection (choosing between 1 of 2 options for rhythm)  
    - /setting (cube \#, setting)  
  - Player volume, for all players  
    - /volume (cube \#, volume)  
  - Player panning, for all players  
    - /pan (cube \#, pan)  
  - Enabled tracks  
    - /enabled (array of 1s and 0s for enabled/disabled cubes)  
- Player has two stages  
  - Selecting a cube, where current player selections are broadcast (so two people can't operate the same cube)  
    - /players  
  - Cube selected, where setting, volume, and pan messages are sent to the server  
    - /player/setting, /player/volume, /player/pan  
- There can only be one Conductor  
  - Send a list of sections to play  
    - /conductor/section (array of enabled/disabled cubes)  
- Heartbeats  
  - I want to keep track of who leaves the game  
  - Every 5 seconds, send a ping to all Players and Conductor  
    - /ping (id)  
  - Expect to receive a pong within 1 second, drop the Player if not received  
    - /pong (id)  
- Server  
  - Translates Player messages (/player/setting, /player/volume) to appropriate global messages (/setting, /volume)  
  - Authority for game state (active players, conductor)

## Running
To run my code, you should have node installed on your computer ([https://nodejs.org/en/download](https://nodejs.org/en/download)). Run \``cd waveclient && npm i && npm run start`\` to start the client. Run \``cd waveserver && npm i && npm run start`\` to start the server. 

Alternatively, if you just want to hear the bare-bones Chuck file, navigate to the chuck folder \``cd waveclient/public/chuck`\` and open or run **tapper.ck**. Modify the values in the arrays to get different sounds \- this happens automatically (hence the 'global' modifiers) on the viewer client.

I already have both the client and server hosted online, at [https://wavetapper.leonzong.com/](https://wavetapper.leonzong.com/). Navigate here and join as the viewer, open another tab and join as the conductor or as multiple players. That's another way to test it. Code is hosted on GitHub here: [https://github.com/zongleon/wavetapper](https://github.com/zongleon/wavetapper).

## Performing
To perform the piece, you should be a viewer. You should also be the conductor. As the conductor, I would generally add and remove parts to build up the piece. There are some predefined sections you can use to structure the way you add parts, but doing it manually is fun\! There isn't a set order you should play it in – just have fun.

## Notes
I'm sad I had some technical difficulties, but I definitely should've done some more testing (with more players). I think the biggest problem was that my server was too small and was hitting 100% CPU utilization when everyone joined.

If I had more time, I would've liked to add more options for players to interact with the game – perhaps a random element. I also wanted players tapping the cubes to do something but couldn't think of anything. I'll probably keep updating this project sparsely as I find time, though\!

There are some technical details I didn't go into in my Design sections for clarity. I use **Vite** as my build tool. While I specify Javascript, I'm really writing **Typescript**. The server is **express**\-js under the hood. OSC communications all happen with this library: [**https://github.com/adzialocha/osc-js**](https://github.com/adzialocha/osc-js), which does a lot of heavy lifting. I configured it to use **WebSockets** as my messaging protocol. The server is hosted on **Oracle Cloud** (free tier\!). The client is hosted on **GitHub Pages**.

## Too long; didn't read?
View the Chuck code at waveclient/public/chuck/tapper.ck. Basically, the Players and Conductor set the parameters of the song. And the Viewer plays the music and animates the cubes\! Please email me with any questions: [leon@leonzong.com](mailto:leon@leonzong.com) 