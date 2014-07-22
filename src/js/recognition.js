function Recognition(loadingProgressCallback, recognizedKanjiClickHandler) {

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

    this.kanjis = kanjis;

    initData();

    function initData() {
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

        function doInit(recog) {
            var count = 0,
                fullLength = Object.keys(recog).length,
                tickEvery = 5,                                      // call progress cb on every tickEvery%
                percentTick = (fullLength / (100 / tickEvery)) ^ 0;

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
                if (loadingProgressCallback && count % percentTick == 0) {
                    loadingProgressCallback(tickEvery * count / percentTick ^ 0);
                }
                count++;
            }
        }
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
            })
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
                if (drawnDirections[i] == kanjiDirections[i]) {
                    score += STROKE_DIRECTION_WEIGHT;
                } else if (directions.isClose(drawnDirections[i], kanjiDirections[i])) {
                    score += STROKE_DIRECTION_WEIGHT * CLOSE_WEIGHT;
                }

                if (i > 0) {
                    if (drawnMoves[i - 1] == kanjiMoves[i - 1]) {
                        score += MOVE_DIRECTION_WEIGHT;
                    } else if (directions.isClose(drawnMoves[i - 1], kanjiMoves[i - 1])) {
                        score += MOVE_DIRECTION_WEIGHT * CLOSE_WEIGHT;
                    }
                }

                if (drawnStarts[i] == kanjiStarts[i]) {
                    score += STROKE_LOCATION_WEIGHT;
                } else if (locations.isClose(drawnStarts[i], kanjiStarts[i])) {
                    score += STROKE_LOCATION_WEIGHT * CLOSE_WEIGHT;
                }
                if (drawnEnds[i] == kanjiEnds[i]) {
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

    this.recognize = function (strokesRecogData) {
        var potentialKanji = new Kanji("?", strokesRecogData),
            strictMatches = getStrictMatches(potentialKanji);

        for (var i = 0; i < strictOutputs.children.length; i++) {
            strictOutputs.children[i].innerHTML = strictMatches[i] ? strictMatches[i].symbol : "";
        }
    };
}