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

// sound play event (for animation, etc)
[0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0] @=> global int poss[];

global Event soundEvent;
global Event loopEvent;

// Define the sound sources
[
    "tracks/track 1-1 kick.wav",
    "tracks/track 2-1 snare.wav",
    "tracks/track 3-1 hat.wav",
    "tracks/track 4-1 clhat.wav",
    "tracks/track 5-1 pad.wav",
    "tracks/track 7-1 vox2.wav",
    "tracks/track 8-1 vox3.wav",
    "tracks/track 9-1 vox4.wav",
    "tracks/track 10-1 vox5.wav",
    "tracks/track 11-1 arp.wav",
    "tracks/track 12-1 arpnoise.wav",
    "tracks/track 13-1 dialup.wav",
    "tracks/track 14-1 bass.wav",
    "tracks/track 16 blank.wav", // track 14, reverb guy
    "tracks/track 15-1 vo6.wav",
    "tracks/track 16 blank.wav"
] @=> string files[];

SndBuf sounds[16];
Gain gains[16];
Pan2 pans[16];
JCRev rev;

rev => dac;

0.5 => float baseGain;

for (0 => int i; i < 16; i++) {
    SndBuf sound => Gain gain => Pan2 pan => rev;

    me.dir() + files[i] => sound.read;
    sound.samples() => sound.pos;
    sound @=> sounds[i];
    rev14 => rev.mix;
    gain @=> gains[i];
    pan @=> pans[i];
}

// rhythm
sounds[0].length() => dur patternLength;
// patternLength / 32 - 24::ms => dur triggerTime;
patternLength / 128 => dur triggerTime;

// transient detection
0.005 => float threshold;
fun void transientDetector(SndBuf buf, int i)
{
    float currentSamp, lastSamp, difference;
    buf.last() => currentSamp;
    Math.fabs(currentSamp - lastSamp) => difference; // simpler since only one check per tick

    // <<< difference >>>;
    if (difference > threshold)
    {
        1 => poss[i];
        soundEvent.broadcast();
    }
    lastSamp => currentSamp;
}


// Function to play a pattern
fun void rhythm(int p) {
    0 => sounds[p].pos;
    now => time start;
    while (now < start + patternLength) {
        // detect transient
        transientDetector(sounds[p], p);
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
        patternLength => now;
    }
}

// Function to play a pattern
fun void reverber() {
    now => time start;
    while (now < start + patternLength) {
        rev14 => rev.mix;
        1 => poss[14];
        soundEvent.broadcast();
        triggerTime => now;
    }
    0 => poss[14];
    0 => rev.mix;
}

fun void eventer() {
    while (true) {
        soundEvent => now;
        <<< poss[0], poss[1], poss[2], poss[3], poss[4], poss[5], poss[6], poss[7],
            poss[8], poss[9], poss[10], poss[11], poss[12], poss[13], poss[14], poss[15] >>>;
    }
}
//spork ~ eventer();

for (0 => int i; i < 16; i++) {
    spork ~ effecter(i);
}

while (true) {
    for (0 => int i; i < enabled_sounds.size(); i++) {
        if (enabled_sounds[i] == 1) {
            if (i == 13) {
                spork ~ reverber();
                continue;
            }
            spork ~ rhythm(i);
        }
    }
    // me.yield();
    loopEvent.signal();
    patternLength => now;
}