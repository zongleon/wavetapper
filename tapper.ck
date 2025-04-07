// Define events to start and stop each rhythm
Event start1, stop1;
Event start2, stop2;

// Define the sound sources
SinOsc osc1 => dac;
SinOsc osc2 => dac;

// Set frequencies for each oscillator
440 => osc1.freq;
660 => osc2.freq;

// Set gain for each oscillator
0 => osc1.gain;
0 => osc2.gain;

// rhythm
140 => int bpm;
(1.0 / bpm)::minute => dur beat;
[1, 0, 0, 1, 0, 0, 1, 0] @=> int pattern1[];
[0, 1, 1, 0, 0, 0, 1, 1] @=> int pattern2[];


// Function to play rhythm 1
fun void rhythm1() {
    while (true) {
        start1 => now;
        <<< "Playing rhythm 1" >>>;
        for (int i : pattern1) {
            // Play rhythm 1
            if (i == 1) {
                0.2 => osc1.gain;
            } else {
                0 => osc1.gain;
            }
            beat / 4 => now;
        }
        0 => osc1.gain;
    }
} spork ~ rhythm1();

// Function to play rhythm 2
fun void rhythm2() {
    while (true) {
        start2 => now;
        <<< "Playing rhythm 2" >>>;
        for (int i : pattern2) {
            // Play rhythm 2
            if (i == 1) {
                0.2 => osc2.gain;
            } else {
                0 => osc2.gain;
            }
            beat / 4 => now;
        }
        0 => osc2.gain;
    }
} spork ~ rhythm2();

me.yield();

while (true) {
    start1.broadcast();
    start2.broadcast();

    // me.yield();
    1::samp => now;
}