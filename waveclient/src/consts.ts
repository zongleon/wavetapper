export const SERVER_URL = import.meta.env.MODE == "development" ? "localhost" : "waveserver.leonzong.com";
export const PORT = import.meta.env.MODE == "development" ? 8910 : 443;
export const SSL = import.meta.env.MODE != "development";

// define and export constants
export const HORIZ_SKEW = Math.PI / 6;
export const VERT_ROTATE = Math.PI / 6;
 
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
        [0, 3],
        [0, 3]
    ],
    [
        [1, 5],
        [2, 8]
    ],
    [
        [12, 14],
        [12, 15]
    ],
    [
        [17, 21],
        [18, 21]
    ],
    [
        [23, 24],
        [23, 24]
    ],
    [
        [30, 31],
        [36, 37]
    ],
    [
        [39, 40],
        [41, 42]
    ],
    [ //8
        [85, 93],
        [94, 96]
    ],
    [
        [99, 100],
        [101, 102]
    ],
    [
        [113, 114],
        [115, 116]
    ],
    [
        [117, 118],
        [119, 120]
    ],
    [
        [86, 87],
        [88, 89]  
    ],
    [
        [121, 122],
        [123, 124]
    ], 
    [ // 14
        [105, 106],
        [109, 110]
    ],
    [
        [125, 126],
        [127, 128]
    ],
    [
        [4, 144, 146, 148, 150, 152, 154, 156, 158, 160],
        [4, 145, 147, 148, 151, 153, 155, 157, 158, 161]
    ]
]