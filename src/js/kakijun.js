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
        setActive = JTOOLS.utils.setActive,
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
        toggleGrid = function () {
            if (showGrid) {
                for (var i = grid.length - 1; i >= 0; i--) {
                    grid.pop().remove();
                }
            } else {
                grid = drawGrid();
            }
            showGrid = !showGrid;
            setActive(this, showGrid);
            localStorage.setItem("kj.grid", showGrid);
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
        inpSymbol = document.getElementById("kakijunInput"),
        btnPlay = document.getElementById("btnKakijunPlay"),
        btnClear = document.getElementById("btnKakijunClear"),
        tglGrid = document.getElementById("tglKakijunGrid"),
        paper = svgElem(canvas, "svg", false).attrs({
            width: canvasWidth,
            height: canvasHeight,
            version: "1.1",
            style: "overflow: hidden; position: relative;"
        }).child("desc", "JTOOLS").child("defs"),
        grid = showGrid ? drawGrid() : [],
        bColor = randomStrokesColors ? getRandomColor() : brushColor,
        brushAttrs = updateBrushAttrs(),
        currentKanjiStrokes = [],
        clearCurrentKanji = function () {
            for (var i = currentKanjiStrokes.length - 1; i >= 0 ; i--) {
                currentKanjiStrokes.pop().remove();
            }
        },
        strokeDrawTimeoutId,
        animFrameId;

    tglGrid.onclick = toggleGrid;
    setActive(tglGrid, showGrid);

    btnClear.onclick = function () {
        clearTimeout(strokeDrawTimeoutId);
        cancelAnimationFrame(animFrameId);
        clearCurrentKanji();
    };

    btnPlay.onclick = function () {
        const PIXELS_PER_SECOND = 150; // Скорость рисования (пикселей/сек)
        const DELAY_BETWEEN_PATHS = 250;

        let symbol, kanji, paths, currentPathIndex = 0,
            isAnimating = false;

        clearTimeout(strokeDrawTimeoutId);
        cancelAnimationFrame(animFrameId);
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

        (function startDrawing() {
            if (currentPathIndex >= paths.length || isAnimating) return;

            isAnimating = true;
            const path = svgElem(paper, "path")
                .attrs(brushAttrs)
                .attrs({d: paths[currentPathIndex], transform: "scale(2.629)"});
            currentKanjiStrokes.push(path);

            const length = path.getTotalLength();
            path.style.strokeDasharray = length + 5;
            path.style.strokeDashoffset = length;

            const duration = (length / PIXELS_PER_SECOND) * 1000;
            const startTime = performance.now();

            function animate(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                path.style.strokeDashoffset = length * (1 - progress);

                if (progress < 1) {
                    animFrameId = requestAnimationFrame(animate);
                } else {
                    currentPathIndex++;
                    isAnimating = false;

                    if (currentPathIndex < paths.length) {
                        strokeDrawTimeoutId = setTimeout(startDrawing, DELAY_BETWEEN_PATHS);
                    }
                }
            }

            animFrameId = requestAnimationFrame(animate);
        })();
    };
}