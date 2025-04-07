// Global variables
[0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0] @=> global int enabled_sounds[];
[0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0] @=> global int setting_sounds[];

// sound play event (for animation, etc)
[0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0] @=> global int poss[];
global Event soundEvent;
global Event loopEvent;

// Define the sound sources
SinOsc osc1 => ADSR env1 => dac;
SinOsc osc2 => ADSR env2 => dac;

env1.set(50::ms, 50::ms, 0.2, 50::ms);
env2.set(50::ms, 50::ms, 0.2, 50::ms);

// Set frequencies for each oscillator
440 => osc1.freq;
660 => osc2.freq;

// Set gain for each oscillator
0.2 => osc1.gain;
0.2 => osc2.gain;

// rhythm
140 => int bpm;
(1.0 / bpm)::minute => dur beat;
[1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1] @=> int pattern1[];
[0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0] @=> int pattern2[];

[osc1, osc2] @=> Osc oscs[];
[env1, env2] @=> ADSR envs[];
[pattern1, pattern2] @=> int patterns[][];

// Function to play rhythm 1
fun void rhythm(ADSR env, int pattern[], int p) {
    // <<< "Playing rhythm", pattern >>>;
    for (int i : pattern) {
        // Play rhythm 1
        if (i == 1) {
            1 => env.keyOn;
            1 => poss[p];
            soundEvent.signal();
        } else {
            1 => env.keyOff;
            0 => poss[p];
        }
        beat / 2 => now;
    }
    1 => env.keyOff;
    0 => poss[p];
}

while (true) {
    for (0 => int i; i < patterns.size(); i++) {
        if (enabled_sounds[i] == 1) {
            spork ~ rhythm(envs[i], patterns[i], i);
        }
    }
    // me.yield();
    loopEvent.signal();
    8 * beat => now;
}