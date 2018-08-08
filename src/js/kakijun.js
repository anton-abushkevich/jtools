"use strict";

function Kakijun() {

    var storedGrid = localStorage.getItem("kj.grid"),
        storedUseContour = localStorage.getItem("kj.calligraphy"),
        storedNumbers = localStorage.getItem("kj.numbers"),
        storedColor = localStorage.getItem("kj.color"),
        storedBg = localStorage.getItem("kj.bg"),
        storedThickness = localStorage.getItem("kj.thickness"),
        canvas = document.getElementById("kakijunPaper"),
        canvasWidth = canvas.clientWidth,
        canvasHeight = canvas.clientHeight,
        backgrounds = ["bg-none", "bg-paper", "bg-blackboard"],
        randomStrokesColors = storedColor && storedColor === "random",
        brushColor = !randomStrokesColors && storedColor ? storedColor : "#444",
        showGrid = storedGrid ? storedGrid === "true" : true,
        gridColor = "#000",
        gridSubdivideLevel = 3,
        gridContrast = 3,
        showStrokesNumbers = storedNumbers === "true",
        strokeNumberOffset = 20,
        numberFontSize = 16,
        useContour = storedUseContour ? storedUseContour === "true" : false, // true = calligraphic brush, false = simple path
        strokeThickness = storedThickness ? +storedThickness : 3.81,

        drawGrid = function () {
            var gridLines = [];
            for (var i = gridSubdivideLevel; i >= 1; i--) {
                var factor = Math.pow(2, i),
                    wSeg = canvasWidth / factor,
                    hSeg = canvasHeight / factor,
                    gridPathStr = "";
                for (var j = 1; j < factor; j++) {
                    var x = Math.floor(wSeg * j) + .5, // 0.5 - to sharpen the grid
                        y = Math.floor(hSeg * j) + .5;
                    gridPathStr += "M" + x + " 0V" + canvasHeight + "M0 " + y + "H" + canvasWidth;
                }
                var gridPath = elem(paper, "path", true).attrs({
                    d: gridPathStr,
                    fill: "none", stroke: gridColor, "stroke-width": 1,
                    "stroke-opacity": (1 / (factor * gridContrast))
                });
                gridLines.push(gridPath);
            }
            return gridLines;
        },
        getRandomColor = function () {
            // not too bright, not too dark
            var r = Math.floor(30 + 140 * Math.random()),
                g = Math.floor(30 + 140 * Math.random()),
                b = Math.floor(30 + 140 * Math.random());
            return "rgb(" + r + "," + g + "," + b + ")";
        },
        updateBrushAttrs = function () {
            if (!brushAttrs) {
                brushAttrs = {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round"
                }
            }
            brushAttrs.fill = useContour ? bColor : "none";
            brushAttrs.stroke = bColor;
            brushAttrs["stroke-width"] = useContour ? strokeThickness / 2 : strokeThickness;
            return brushAttrs;
        },
        elem = function (parent, name, prepend) {
            var elem = document.createElementNS("http://www.w3.org/2000/svg", name);
            prepend ? parent.insertBefore(elem, parent.firstChild) : parent.appendChild(elem);

            elem.attrs = function (attributes) {
                for (var key in attributes) {
                    if (attributes.hasOwnProperty(key)) {
                        elem.setAttribute(key, attributes[key]);
                    }
                }
                return elem;
            };
            elem.child = function (name, content) {
                var child = document.createElementNS("http://www.w3.org/2000/svg", name);
                content && (child.innerHTML = content);
                elem.appendChild(child);
                return elem;
            };
            elem.toFront = function () {
                parent.removeChild(elem);
                parent.appendChild(elem);
                return elem;

            };
            elem.remove = function () {
                elem && parent.removeChild(elem);
                elem = null;
                return null;
            };
            return elem;
        },
        inpSymbol = document.getElementById("kakijunSymbol"),
        btnShow = document.getElementById("kakijunShow"),
        btnClear = document.getElementById("kakijunClear"),
        paper = elem(canvas, "svg", false).attrs({
            width: canvasWidth,
            height: canvasHeight,
            version: "1.1",
            style: "overflow: hidden; position: relative;"
        }).child("desc", "JTOOLS").child("defs"),
        grid = showGrid ? drawGrid() : [],
        bColor = randomStrokesColors ? getRandomColor() : brushColor,
        brushAttrs = updateBrushAttrs(),
        timeoutId,
        currentKanjiStrokes = [],
        clearCurrentKanji = function () {
            for (var i = currentKanjiStrokes.length - 1; i >= 0 ; i--) {
                currentKanjiStrokes.pop().remove();
            }
        };

    btnClear.onclick = function () {
        clearTimeout(timeoutId);
        clearCurrentKanji();
    };

    btnShow.onclick = function () {
        var symbol, kanji, paths, i = 0;

        clearTimeout(timeoutId);
        clearCurrentKanji();
        symbol = inpSymbol.value;

        if (symbol) {
            symbol = symbol.substring(0, 1);
        }
        
        kanji = JTOOLS.recognition.getKanji(symbol);

        if (kanji) {
            paths = kanji.paths;
        } else {
            return;
        }

        (function drawPath() {
            currentKanjiStrokes.push(elem(paper, "path").attrs(brushAttrs).attrs({d: paths[i++], transform: "scale(2.629)"}));
            if (i < paths.length) {
                timeoutId = setTimeout(drawPath, 750);
            }
        })();
    };
}