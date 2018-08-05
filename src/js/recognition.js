"use strict";

function Recognition(loadingProgressCallback, recognizedKanjiClickHandler) {

    var VERSION = "0.4",
        kanjis = {},
        kanjisStrokesNumber = {},
        locations = {
            N: [1, 0],
            NE: [2, 0],
            E: [2, 1],
            SE: [2, 2],
            S: [1, 2],
            SW: [0, 2],
            W: [0, 1],
            NW: [0, 0],
            MID: [1, 1],
            isClose: function (location1, location2) {
                return Math.abs(location1[0] - location2[0]) <= 1 && Math.abs(location1[1] - location2[1]) <= 1;
            }
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
            X: -1,
            isClose: function (direction1, direction2) {
                if (direction1 === directions.X || direction2 === directions.X || direction1 === direction2) {
                    return true;
                }
                return (direction1 === ((direction2 + 1) % 8)) || (((direction1 + 1) % 8) === direction2);
            }
        },
        DIRECTION_THRESHOLD = 51,
        DIAGONAL_THRESHOLD = 77,
        STROKE_DIRECTION_WEIGHT = 1.0,
        MOVE_DIRECTION_WEIGHT = 0.8,
        STROKE_LOCATION_WEIGHT = 0.6,
        CLOSE_WEIGHT = 0.7,

        OUTPUT_QUANTITY = 8,
        strictOutputs = document.getElementById("output-strict"),
        fuzzyOutputs = document.getElementById("output-fuzzy"),
        plusMinusOneOutputs = document.getElementById("output-plus-minus-1"),
        plusMinusTwoOutputs = document.getElementById("output-plus-minus-2");

    fillOutputs(strictOutputs);
    fillOutputs(fuzzyOutputs);
    fillOutputs(plusMinusOneOutputs);
    fillOutputs(plusMinusTwoOutputs);

    (function initData() {
        var data = localStorage.getItem("recog"),
            version = localStorage.getItem("recog_version");

        if (data !== null) {
            if (version !== VERSION) {
                downloadData();
            } else {
                try {
                    doInit(JSON.parse(LZString.decompress(data)));
                } catch (e) {
                    downloadData();
                }
            }
        } else {
            downloadData();
        }

        function downloadData() {
            sendRequest("data/recog-" + VERSION + ".json", function (data) {
                localStorage.setItem("recog", LZString.compress(data));
                localStorage.setItem("recog_version", VERSION);
                doInit(JSON.parse(data));
            });
        }

        function doInit(recog) {
            var count = 0,
                fullLength = Object.keys(recog).length,
                tickEvery = 5,                                      // call progress cb on every tickEvery%
                percentTick = (fullLength / (100 / tickEvery)) ^ 0;

            for (var k in recog) {
                if (!recog.hasOwnProperty(k)) {
                    continue;
                }

                var paths = recog[k],
                    kanji = new Kanji(k, normalize(parsePaths(paths)), paths),
                    sub = kanjis[kanji.strokes.length];

                kanjisStrokesNumber[k] = paths.length;

                if (!sub) {
                    sub = {};
                    kanjis[kanji.strokes.length] = sub;
                }
                sub[kanji.symbol] = kanji;
                if (loadingProgressCallback && count % percentTick === 0) {
                    loadingProgressCallback(tickEvery * count / percentTick ^ 0);
                }
                count++;
            }
        }
    }());

    function Kanji(symbol, normalizedStrokesData, paths) {
        var strokeStarts = [],
            strokeEnds = [],
            strokeDirections = [],
            moveDirections = [];

        this.symbol = symbol;
        this.strokes = normalizedStrokesData;
        this.paths = paths;
        this.strokeStarts = strokeStarts;
        this.strokeEnds = strokeEnds;
        this.strokeDirections = strokeDirections;
        this.moveDirections = moveDirections;

        for (var i = 0; i < normalizedStrokesData.length; i++) {
            var stroke = normalizedStrokesData[i];
            strokeStarts.push(getLocation(stroke[0], stroke[1]));
            strokeEnds.push(getLocation(stroke[2], stroke[3]));
            strokeDirections.push(getDirection(stroke[0], stroke[1], stroke[2], stroke[3]));
            if (i > 0) {
                moveDirections.push(getDirection(normalizedStrokesData[i - 1][2], normalizedStrokesData[i - 1][3],
                    stroke[0], stroke[1]));
            }
        }
    }

    function getLocation(x, y) {
        if (x < 85) {
            if (y < 85) {
                return locations.NW;
            } else if (y < 170) {
                return locations.W;
            } else {
                return locations.SW;
            }
        } else if (x < 170) {
            if (y < 85) {
                return locations.N;
            } else if (y < 170) {
                return locations.MID;
            } else {
                return locations.S;
            }
        } else {
            if (y < 85) {
                return locations.NE;
            } else if (y < 170) {
                return locations.E;
            } else {
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
                } else {
                    return directions.E;
                }
            } else {
                if (diagonal) {
                    return deltaY < 0 ? directions.NW : directions.SW;
                } else {
                    return directions.W;
                }
            }
        } else {
            diagonal = absDeltaX > ((DIAGONAL_THRESHOLD * absDeltaY) >> 8);
            if (deltaY > 0) {
                if (diagonal) {
                    return deltaX < 0 ? directions.SW : directions.SE;
                } else {
                    return directions.S;
                }
            } else {
                if (diagonal) {
                    return deltaX < 0 ? directions.NW : directions.NE;
                } else {
                    return directions.N;
                }
            }
        }
    }

    function getStrictMatches(potentialKanji) {
        var matches = [],
            kanjisList = kanjis[potentialKanji.strokes.length],

            drawnStarts = potentialKanji.strokeStarts,
            drawnEnds = potentialKanji.strokeEnds,
            drawnDirections = potentialKanji.strokeDirections,
            drawnMoves = potentialKanji.moveDirections;

        for (var k in kanjisList) {
            if (!kanjisList.hasOwnProperty(k)) {
                continue;
            }
            var score = getScore(kanjisList[k]),
                match = kanjisList[k].symbol;
            matches.push({
                symbol: match,
                score: score
            });
        }

        matches.sort(function (k1, k2) {
            if (k1.score > k2.score) return -1;
            if (k1.score < k2.score) return 1;
            return 0;
        });

        return matches.slice(0, OUTPUT_QUANTITY);

        function getScore(kanji) {
            var kanjiStarts = kanji.strokeStarts,
                kanjiEnds = kanji.strokeEnds,
                kanjiDirections = kanji.strokeDirections,
                kanjiMoves = kanji.moveDirections,
                score = 0;

            for (var i = 0; i < drawnStarts.length; i++) {
                if (drawnDirections[i] === kanjiDirections[i]) {
                    score += STROKE_DIRECTION_WEIGHT;
                } else if (directions.isClose(drawnDirections[i], kanjiDirections[i])) {
                    score += STROKE_DIRECTION_WEIGHT * CLOSE_WEIGHT;
                }

                if (i > 0) {
                    if (drawnMoves[i - 1] === kanjiMoves[i - 1]) {
                        score += MOVE_DIRECTION_WEIGHT;
                    } else if (directions.isClose(drawnMoves[i - 1], kanjiMoves[i - 1])) {
                        score += MOVE_DIRECTION_WEIGHT * CLOSE_WEIGHT;
                    }
                }

                if (drawnStarts[i] === kanjiStarts[i]) {
                    score += STROKE_LOCATION_WEIGHT;
                } else if (locations.isClose(drawnStarts[i], kanjiStarts[i])) {
                    score += STROKE_LOCATION_WEIGHT * CLOSE_WEIGHT;
                }
                if (drawnEnds[i] === kanjiEnds[i]) {
                    score += STROKE_LOCATION_WEIGHT;
                } else if (locations.isClose(drawnEnds[i], kanjiEnds[i])) {
                    score += STROKE_LOCATION_WEIGHT * CLOSE_WEIGHT;
                }
            }

            var max = drawnStarts.length * (STROKE_DIRECTION_WEIGHT + 2 * STROKE_LOCATION_WEIGHT)
                + (drawnStarts.length - 1) * MOVE_DIRECTION_WEIGHT;

            return 100 * score / max;
        }
    }

    function fillOutputs(outputBlock) {
        for (var i = 0; i < OUTPUT_QUANTITY; i++) {
            var item = document.createElement("div");
            item.classList.add("output-item");
            item.classList.add("no-drag");
            item.onclick = function (e) {
                e.preventDefault();
                recognizedKanjiClickHandler(this.innerHTML);
            };
            outputBlock.appendChild(item);
        }
    }

    /* strokesData = [ [startX, startY, endX, endY], ... ]*/
    function normalize(strokesData) {
        var dots,
            minX = Number.MAX_VALUE,
            minY = Number.MAX_VALUE,
            maxX = Number.MIN_VALUE,
            maxY = Number.MIN_VALUE,
            i,
            normalizedStrokesData = [];
        for (i = 0; i < strokesData.length; i++) {
            dots = strokesData[i];
            if (dots[0] < minX) {
                minX = dots[0];
            }
            if (dots[1] < minY) {
                minY = dots[1];
            }
            if (dots[0] > maxX) {
                maxX = dots[0];
            }
            if (dots[1] > maxY) {
                maxY = dots[1];
            }
            if (dots[2] < minX) {
                minX = dots[2];
            }
            if (dots[3] < minY) {
                minY = dots[3];
            }
            if (dots[2] > maxX) {
                maxX = dots[2];
            }
            if (dots[3] > maxY) {
                maxY = dots[3];
            }
        }

        // prevent division by zero
        if (minX - maxX === 0) {
            minX += .01;
            maxX -= .01;
        }
        if (minY - maxY === 0) {
            minY += .01;
            maxY -= .01;
        }

        var xRange = Math.abs(minX - maxX),
            yRange = Math.abs(minY - maxY),
            adjust;
        if (xRange > 5 * yRange) {
            adjust = (xRange - yRange) / 2;
            minY -= adjust;
            maxY += adjust;
        } else if (yRange > 5 * xRange) {
            adjust = (yRange - xRange) / 2;
            minX -= adjust;
            maxX += adjust;
        }

        var startX, startY, endX, endY;
        for (i = 0; i < strokesData.length; i++) {
            dots = strokesData[i];
            startX = 255 * (dots[0] - minX) / (maxX - minX);
            startY = 255 * (dots[1] - minY) / (maxY - minY);
            endX = 255 * (dots[2] - minX) / (maxX - minX);
            endY = 255 * (dots[3] - minY) / (maxY - minY);
            normalizedStrokesData.push([startX, startY, endX, endY]);
        }

        return normalizedStrokesData;
    }

    function parsePaths(paths) {
        var strokesData = [],
            EOL = -1,
            NUMBER = -2;

        for (var i = 0; i < paths.length; i++) {
            strokesData.push(parsePath(paths[i]));
        }

        return strokesData;

        function parsePath(pathStr) {
            var path = Path(pathStr),
                startX, startY,
                endX, endY;

            var initial = path.readLetter();
            if (initial !== 'M'.charCodeAt(0) && initial !== 'm'.charCodeAt(0)) {
                return error("Path must start with 'M' or 'm'");
            }

            startX = path.readNumber();
            startY = path.readNumber();

            // Handle all other commands
            endX = startX;
            endY = startY;
            var lastCommand = -1;

            while (true) {
                var command = path.readLetter();
                if (command === NUMBER) {
                    if (lastCommand === -1) {
                        return error("Expecting command, not number");
                    }
                    command = lastCommand;
                } else {
                    lastCommand = command;
                }
                switch (command) {
                    case EOL:
                        return [startX, startY, endX, endY];
                    case 'c'.charCodeAt(0):
                        path.readNumber();
                        path.readNumber();
                        path.readNumber();
                        path.readNumber();
                        endX += path.readNumber();
                        endY += path.readNumber();
                        break;
                    case 'C'.charCodeAt(0):
                        path.readNumber();
                        path.readNumber();
                        path.readNumber();
                        path.readNumber();
                        endX = path.readNumber();
                        endY = path.readNumber();
                        break;
                    case 's'.charCodeAt(0):
                        path.readNumber();
                        path.readNumber();
                        endX += path.readNumber();
                        endY += path.readNumber();
                        break;
                    case 'S'.charCodeAt(0):
                        path.readNumber();
                        path.readNumber();
                        endX = path.readNumber();
                        endY = path.readNumber();
                        break;
                    case 'z'.charCodeAt(0):
                    case 'Z'.charCodeAt(0):
                        endX = startX;
                        endY = startY;
                        break;
                    default:
                        return error("Unexpected path command: " + command);
                }
            }

            function error(message) {
                console.log(message + ". Invalid path: " + pathStr);
                return [0, 0, 0, 0];
            }
        }

        function Path(path) {
            var remaining = path;

            return {
                readLetter: function () {
                    var pos = 0;
                    while (true) {
                        if (pos === remaining.length) {
                            return EOL;
                        }
                        var letter = remaining.charCodeAt(pos);
                        if (letter !== ' '.charCodeAt(0)) {
                            if (letter === ','.charCodeAt(0) ||
                                letter === '-'.charCodeAt(0) ||
                                letter === '+'.charCodeAt(0) ||
                                (letter >= '0'.charCodeAt(0) && letter <= '9'.charCodeAt(0))) {
                                return NUMBER;
                            }
                            remaining = remaining.substring(pos + 1);
                            return letter;
                        }
                        pos++;
                    }
                },
                readNumber: function () {
                    var start = 0, end, c;
                    while (true) {
                        c = remaining.charCodeAt(start);
                        if (c !== ','.charCodeAt(0) && c !== ' '.charCodeAt(0) && c !== '+'.charCodeAt(0)) {
                            break;
                        }
                        start++;
                    }

                    end = start + 1;
                    while (true) {
                        if (end === remaining.length) {
                            break;
                        }
                        c = remaining.charCodeAt(end);
                        if (c !== '.' && (c < '0'.charCodeAt(0) || c > '9'.charCodeAt(0))) {
                            break;
                        }
                        end++;
                    }

                    var number = remaining.substring(start, end);
                    remaining = remaining.substring(end);

                    return Number(number);
                }
            }
        }
    }

    this.recognize = function (strokesData) {
        var potentialKanji = new Kanji("?", normalize(strokesData)),
            strictMatches = getStrictMatches(potentialKanji);

        for (var i = 0; i < strictOutputs.children.length; i++) {
            strictOutputs.children[i].innerHTML = strictMatches[i] ? strictMatches[i].symbol : "";
        }
    };

    this.getKanji = function (symbol) {
        return kanjis[kanjisStrokesNumber[symbol]][symbol];
    }
}