// ------------------------------------
// LEON ZONG FINAL PROJECT (wavetapper)
// ------------------------------------

// ---------------------------------------------
// global variables (aka, managed in Javascript)
// ---------------------------------------------

// binary array of sounds that should be played
[0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0] @=> global int enabled_sounds[];

// player selections
[0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0] @=> global int setting_sounds[];

// player gain (deviation from baseGain)
[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0] @=> global float gains_sounds[];

// player pan
[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0] @=> global float pans_sounds[];

// player 14 gets special controls for their reverb effect
0 => global float rev14;
0 => int enable14;

// sound play event (for animation, etc) (listened for in JS)
[0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0] @=> global int poss[];

global Event soundEvent;
global Event loopEvent;

// ---------------------------------------------
// sounmd setup
// ---------------------------------------------

// Define the sound sources
SndBuf sounds[16];
Gain gains[16];
Pan2 pans[16];
JCRev revs[16];
Chorus choruses[16];

0.5 => float baseGain;

for (0 => int i; i < 16; i++) {
    if (i == 13 || i == 15) {
        // player 14 (13) is reverb
        // player 16 (15) is just visual
        continue;
    }
    // signal chain (it's a lot, i know)
    SndBuf sound => Gain gain => JCRev rev => Chorus ch => Pan2 pan => dac;

    // mute reverb and chorus
    0 => ch.mix;
    rev14 => rev.mix;

    // load an initial sound file
    me.dir() + "tracks/TRACK " + (i + 1) + "-" + (setting_sounds[i] + 1) + ".wav" => sound.read;
    sound.samples() => sound.pos;
    sound @=> sounds[i];
    gain @=> gains[i];
    rev @=> revs[i];
    pan @=> pans[i];
    ch @=> choruses[i];
}

// ---------------------------------------------
// utility functions for playing and processing sounds
// ---------------------------------------------

// rhythms
sounds[0].length() => dur patternLength;
patternLength / 128 => dur triggerTime;

// transient detection
0.003 => float threshold;
fun float transientDetector(SndBuf buf, int i, float lastSamp)
{
    float currentSamp, difference;
    buf.last() => currentSamp;
    Math.fabs(currentSamp - lastSamp) => difference;

    // <<< difference >>>; // check the difference between adjacent samples
    if (difference > threshold)
    {
        // set element i to be triggered,
        // and broadcast the event to JS
        1 => poss[i];
        soundEvent.broadcast();
    }
    return currentSamp;
}


// Function to play a pattern
fun void rhythm(int p) {
    // play pattern p!
    0 => sounds[p].pos;
    now => time start;

    // and keep track, for the transient detector
    float lastSamp;
    while (now < start + patternLength) {
        // detect transient
        transientDetector(sounds[p], p, lastSamp) => lastSamp;
        triggerTime => now;
        0 => poss[p];
    }
    0 => poss[p];
}

// function (for each rhythm) to update gain and pan
fun void effecter(int p) {
    while (true) {
        // update gain
        gains_sounds[p] + baseGain => gains[p].gain;
        pans_sounds[p] => pans[p].pan;

        // only set reverb effects if enabled
        if (enable14) {
            rev14 => revs[p].mix;
            if (setting_sounds[13] == 1) {
                rev14 * 10 => choruses[p].mix;
            } else {
                0 => choruses[p].mix;
            }
        } else {
            0 => revs[p].mix;
            0 => choruses[p].mix;
        }

        triggerTime => now;
    }
}

// Function to play a pattern
// Since the reverb audio file doesn't exist,
// i needed to trigger a set pattern (for this, all the time)
fun void reverber() {
    now => time start;
    while (now < start + patternLength) {
        // rev14 => rev.mix;
        1 => poss[13];
        soundEvent.broadcast();
        triggerTime => now;
    }
    0 => poss[13];
}

// purely for debugging
fun void eventer() {
    while (true) {
        soundEvent => now;
        <<< poss[0], poss[1], poss[2], poss[3], poss[4], poss[5], poss[6], poss[7],
            poss[8], poss[9], poss[10], poss[11], poss[12], poss[13], poss[14], poss[15] >>>;
    }
}
//spork ~ eventer();

// for when players switch their setting. re-read it!
fun void reloadSound(int p) {
    me.dir() + "tracks/TRACK " + (p + 1) + "-" + (setting_sounds[p] + 1) + ".wav" => sounds[p].read;
    sounds[p].samples() => sounds[p].pos;
}

// ---------------------------------------------
// main loop! run and play the sounds that come in
// ---------------------------------------------


for (0 => int i; i < 16; i++) {
    spork ~ effecter(i);
}

while (true) {
    0 => enable14;
    for (0 => int i; i < enabled_sounds.size(); i++) {
        if (enabled_sounds[i] == 1) {
            if (i == 13) {
                // 14 is enabled! time to reverb
                spork ~ reverber();
                1 => enable14;
                continue;
            }
            if (i == 15) {
                continue;
            }
            // reload the sound and play it
            reloadSound(i);
            spork ~ rhythm(i);
        }
    }
    // i was doing something with this event but no longer
    loopEvent.signal();

    // IMPORTANT: update everything only once per patternLength
    patternLength => now;
}