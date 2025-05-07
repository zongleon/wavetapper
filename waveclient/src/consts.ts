export const PORT = 8910;
// define and export constants
export const HORIZ_SKEW = Math.PI / 6;
export const VERT_ROTATE = Math.PI / 6;

export const SOUNDFILES = [
    "tracks/track 1-1 kick.wav",
    "tracks/track 2-1 snare.wav",
    "tracks/track 3-1 hat.wav",
    "tracks/track 4-1 clhat.wav",
    "tracks/track 5-1 pad.wav",
    "tracks/track 6-1 vox1.wav",
    "tracks/track 7-1 vox2.wav",
    "tracks/track 8-1 vox3.wav",
    "tracks/track 9-1 vox4.wav",
    "tracks/track 10-1 vox5.wav",
    "tracks/track 11-1 arp.wav",
    "tracks/track 12-1 arpnoise.wav",
    "tracks/track 13-1 dialup.wav",
    "tracks/track 14-1 bass.wav",
    "tracks/track 15-1 vo6.wav",
    "tracks/track 16 blank.wav"
];
  
export const COLORS = [
    ["#5A2E2E", "#E57373", "#FFCDD2"],
    ["#5A3E2E", "#E59873", "#FFE0B2"],
    ["#5A522E", "#E5D173", "#FFF9C4"],
    ["#4A5A2E", "#C5E573", "#F0F4C3"],
    ["#44554C", "#A5D6A7", "#C8E6C9"],
    ["#2E5A2E", "#73E573", "#C8E6C9"],
    ["#2E5A4A", "#73E5AD", "#C8E6C9"],
    ["#4A555A", "#A7D6E5", "#C8E6C9"],
    ["#2E3E5A", "#739EE5", "#BBDEFB"],
    ["#3A2E5A", "#9873E5", "#E1BEE7"],
    ["#4A2E5A", "#AD73E5", "#E1BEE7"],
    ["#5A2E5A", "#E573E5", "#F8BBD0"],
    ["#5A2E4A", "#E573A7", "#F8BBD0"],
    ["#5A2E3A", "#E5738A", "#F8BBD0"],
    ["#4A4A4A", "#A4A4A4", "#EEEEEE"],
    ["#2E2E2E", "#737373", "#CCCCCC"]
];
  
export const DESIGNS = [
    [
        [0, 0],
        [3, 3]
    ],
    [
        [1, 2],
        [5, 8]
    ],
    [
        [12, 12],
        [14, 15]
    ],
    [
        [17, 18],
        [21, 21]
    ],
    [
        [23, 23],
        [24, 24]
    ],
    [
        [30, 31],
        [36, 37]
    ],
    [
        [44, 45, 46, 47, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
        [4, 4]
    ],
    [
        [70, 71],
        [72, 73]
    ]
]

for (let i = 9; i <= 16; i++) {
    DESIGNS.push([
        [73 + i, 74 + i],
        [75 + i, 76 + i]
    ]);
}
