function Recognition(loadingProgressCallback) {

    var VERSION = '0.2',
        kanjis = {},
        locations = {
            N: [1, 0],
            NE: [2, 0],
            E: [2, 1],
            SE: [2, 2],
            S: [1, 2],
            SW: [0, 2],
            W: [0, 1],
            NW: [0, 0],
            MID: [1, 1]
        },
        directions = {
            N: 0,
            NE: 1,
            E: 2,
            SE: 3,
            S: 4,
            SW: 5,
            W: 6,
            NW: 7,
            X: -1
        },
        DIRECTION_THRESHOLD = 51,
        DIAGONAL_THRESHOLD = 77;

    this.kanjis = kanjis;

    init();

    function init() {
        var data = localStorage.getItem("recog"),
            version = localStorage.getItem("recog_version");

        if (data !== null) {
            if (version != VERSION) {
                downloadData();
            } else {
                doInit(JSON.parse(data));
            }
        } else {
            downloadData();
        }

        function downloadData() {
            sendRequest("data/recog-" + VERSION + ".json", function (data) {
                localStorage.setItem("recog", data);
                localStorage.setItem("recog_version", VERSION);
                doInit(JSON.parse(data));
            });
        }
    }

    function doInit(recog) {
        var count = 0,
            fullLength = Object.keys(recog).length,
            tickEvery = 5,                                      // call progress cb on every tickEvery%
            percentTick = (fullLength / (100 / tickEvery)) ^ 0;
            start = new Date;
        for (var k in recog) {
            if (!recog.hasOwnProperty(k)) {
                continue;
            }

            var kanji = new Kanji(k, recog[k]),
                sub = kanjis[kanji.strokes.length];

            if (!sub) {
                sub = {};
                kanjis[kanji.strokes.length] = sub;
            }
            sub[kanji.symbol] = kanji;
            if(loadingProgressCallback && count % percentTick == 0) {
                loadingProgressCallback(tickEvery * count / percentTick ^ 0);
            }
            count++;
        }
        console.log("Parse complete in: " + ((new Date - start) / 1000) + " sec");
    }

    function Kanji(symbol, strokesRecogData) {
        var strokes = [],
            strokeStarts = [],
            strokeEnds = [],
            strokeDirections = [],
            moveDirections = [],
            i, stroke;

        this.symbol = symbol;
        this.strokes = strokes;
        this.strokeStarts = strokeStarts;
        this.strokeEnds = strokeEnds;
        this.strokeDirections = strokeDirections;
        this.moveDirections = moveDirections;

        if (strokesRecogData) {
            parseRecogData();
        }

        function parseRecogData() {
            strokesRecogData = strokesRecogData.replace(/x/g, "00").replace(/y/g, "ff");
            if (strokesRecogData.length % 8 != 0) {
                return;
            }
            var count = strokesRecogData.length / 8;
            for (i = 0; i < count; i++) {
                stroke = strokesRecogData.substr(i * 8, 8);
                var x1 = parseInt(stroke.substr(0, 2), 16),
                    y1 = parseInt(stroke.substr(2, 2), 16),
                    x2 = parseInt(stroke.substr(4, 2), 16),
                    y2 = parseInt(stroke.substr(6, 2), 16);
                strokes[i] = [x1, y1, x2, y2];
                strokeStarts.push(getLocation(x1, y1));
                strokeEnds.push(getLocation(x2, y2));
                strokeDirections.push(getDirection(x1, y1, x2, y2));
                if (i > 0) {
                    moveDirections.push(getDirection(strokes[i - 1][2], strokes[i - 1][3], x1, y1));
                }
            }
        }
    }

    function getLocation(x, y) {
        if (x < 85) {
            if (y < 85) {
                return locations.NW;
            }
            else if (y < 170) {
                return locations.W;
            }
            else {
                return locations.SW;
            }
        }
        else if (x < 170) {
            if (y < 85) {
                return locations.N;
            }
            else if (y < 170) {
                return locations.MID;
            }
            else {
                return locations.S;
            }
        }
        else {
            if (y < 85) {
                return locations.NE;
            }
            else if (y < 170) {
                return locations.E;
            }
            else {
                return locations.SE;
            }
        }
    }

    function getDirection(x1, y1, x2, y2) {
        var deltaX = x2 - x1,
            deltaY = y2 - y1,
            absDeltaX = Math.abs(deltaX),
            absDeltaY = Math.abs(deltaY),
            diagonal;

        if (absDeltaX < DIRECTION_THRESHOLD && absDeltaY < DIRECTION_THRESHOLD) {
            return directions.X;
        }

        if (absDeltaX > absDeltaY) {
            diagonal = absDeltaY > ((DIAGONAL_THRESHOLD * absDeltaX) >> 8);
            if (deltaX > 0) {
                if (diagonal) {
                    return deltaY < 0 ? directions.NE : directions.SE;
                }
                else {
                    return directions.E;
                }
            }
            else {
                if (diagonal) {
                    return deltaY < 0 ? directions.NW : directions.SW;
                }
                else {
                    return directions.W;
                }
            }
        }
        else {
            diagonal = absDeltaX > ((DIAGONAL_THRESHOLD * absDeltaY) >> 8);
            if (deltaY > 0) {
                if (diagonal) {
                    return deltaX < 0 ? directions.SW : directions.SE;
                }
                else {
                    return directions.S;
                }
            }
            else {
                if (diagonal) {
                    return deltaX < 0 ? directions.NW : directions.NE;
                }
                else {
                    return directions.N;
                }
            }
        }
    }
}