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
        svgElem = JTOOLS.utils.svgElem,
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

        drawGrid = () => JTOOLS.utils.drawGrid(paper, canvasWidth, canvasHeight),
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
        inpSymbol = document.getElementById("kakijunSymbol"),
        btnShow = document.getElementById("kakijunShow"),
        btnClear = document.getElementById("kakijunClear"),
        paper = svgElem(canvas, "svg", false).attrs({
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
            currentKanjiStrokes.push(svgElem(paper, "path").attrs(brushAttrs).attrs({d: paths[i++], transform: "scale(2.629)"}));
            if (i < paths.length) {
                timeoutId = setTimeout(drawPath, 750);
            }
        })();
    };

    return {
        drawPath: function (path) {
            currentKanjiStrokes.push(svgElem(paper, "path").attrs(brushAttrs).attrs({d: path, transform: "scale(2.629)"}));
        }
    };
}