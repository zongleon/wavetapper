// Global variables
[0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0] @=> global int enabled_sounds[];
[0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0] @=> global int setting_sounds[];
[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0] @=> global float gains_sounds[];
[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0] @=> global float pans_sounds[];
 
0 => global float rev14;
0 => int enable14;

// sound play event (for animation, etc)
[0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0] @=> global int poss[];

global Event soundEvent;
global Event loopEvent;

// Define the sound sources
SndBuf sounds[16];
Gain gains[16];
Pan2 pans[16];
JCRev revs[16];
Chorus choruses[16];

0.5 => float baseGain;

for (0 => int i; i < 16; i++) {
    if (i == 13 || i == 15) {
        continue;
    }
    SndBuf sound => Gain gain => JCRev rev => Chorus ch => Pan2 pan => dac;

    0 => ch.mix;
    rev14 => rev.mix;

    me.dir() + "tracks/TRACK " + (i + 1) + "-" + (setting_sounds[i] + 1) + ".wav" => sound.read;
    sound.samples() => sound.pos;
    sound @=> sounds[i];
    gain @=> gains[i];
    rev @=> revs[i];
    pan @=> pans[i];
    ch @=> choruses[i];
}

// rhythm
sounds[0].length() => dur patternLength;
// patternLength / 32 - 24::ms => dur triggerTime;
patternLength / 128 => dur triggerTime;

// transient detection
0.003 => float threshold;
fun float transientDetector(SndBuf buf, int i, float lastSamp)
{
    float currentSamp, difference;
    buf.last() => currentSamp;
    Math.fabs(currentSamp - lastSamp) => difference; // simpler since only one check per tick

    // <<< difference >>>;
    if (difference > threshold)
    {
        1 => poss[i];
        soundEvent.broadcast();
    }
    return currentSamp;
}


// Function to play a pattern
fun void rhythm(int p) {
    0 => sounds[p].pos;
    now => time start;
    float lastSamp;
    while (now < start + patternLength) {
        // detect transient
        transientDetector(sounds[p], p, lastSamp) => lastSamp;
        triggerTime => now;
        0 => poss[p];
    }
    0 => poss[p];
}

fun void effecter(int p) {
    while (true) {
        // update gain
        gains_sounds[p] + baseGain => gains[p].gain;
        pans_sounds[p] => pans[p].pan;

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

fun void eventer() {
    while (true) {
        soundEvent => now;
        <<< poss[0], poss[1], poss[2], poss[3], poss[4], poss[5], poss[6], poss[7],
            poss[8], poss[9], poss[10], poss[11], poss[12], poss[13], poss[14], poss[15] >>>;
    }
}
//spork ~ eventer();

fun void reloadSound(int p) {
    me.dir() + "tracks/TRACK " + (p + 1) + "-" + (setting_sounds[p] + 1) + ".wav" => sounds[p].read;
    sounds[p].samples() => sounds[p].pos;
}

for (0 => int i; i < 16; i++) {
    spork ~ effecter(i);
}

while (true) {
    0 => enable14;
    for (0 => int i; i < enabled_sounds.size(); i++) {
        if (enabled_sounds[i] == 1) {
            if (i == 13) {
                spork ~ reverber();
                1 => enable14;
                continue;
            }
            if (i == 15) {
                continue;
            }
            // <<< gains[i].gain(), pans[i].pan() >>>;
            reloadSound(i);
            spork ~ rhythm(i);
        }
    }
    // me.yield();
    loopEvent.signal();
    patternLength => now;
}