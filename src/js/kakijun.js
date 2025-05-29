"use strict";

function Kakijun() {

    const PIXELS_PER_SECOND = 150;
    const DELAY_BETWEEN_PATHS = 250;

    const canvas = document.getElementById("kakijunPaper"),
        canvasWidth = canvas.clientWidth,
        canvasHeight = canvas.clientHeight,
        svgElem = JTOOLS.utils.svgElem,
        setActive = JTOOLS.utils.setActive,
        drawGrid = () => JTOOLS.utils.drawGrid(paper, canvasWidth, canvasHeight),
        getRandomColor = JTOOLS.utils.getRandomColor,
        paper = svgElem(canvas, "svg", false).attrs({
            width: canvasWidth,
            height: canvasHeight,
            version: "1.1",
            style: "overflow: hidden; position: relative;"
        }).child("desc", "JTOOLS").child("defs"),
        backgrounds = ["bg-none", "bg-paper", "bg-blackboard"],
        gridColor = "#000",
        gridSubdivideLevel = 3,
        gridContrast = 3,
        strokeNumberOffset = 20,
        numberFontSize = 16,
        inpSymbol = document.getElementById("kakijunInput"),
        slider = document.getElementById("kakijunProgress"),
        btnPlay = document.getElementById("btnKakijunPlay"),
        btnClear = document.getElementById("btnKakijunClear"),
        tglGrid = document.getElementById("tglKakijunGrid"),
        animationSegments = [];

    let storedGrid = localStorage.getItem("kj.grid"),
        storedNumbers = localStorage.getItem("kj.numbers"),
        storedColor = localStorage.getItem("kj.color"),
        storedBg = localStorage.getItem("kj.bg"),
        storedThickness = localStorage.getItem("kj.thickness"),
        randomStrokesColors = storedColor && storedColor === "random",
        brushColor = !randomStrokesColors && storedColor ? storedColor : "#444",
        showGrid = storedGrid ? storedGrid === "true" : true,
        showStrokesNumbers = storedNumbers === "true",
        strokeThickness = storedThickness ? +storedThickness : 4.5,
        totalDuration = 0,
        grid = showGrid ? drawGrid() : [],
        bColor = randomStrokesColors ? getRandomColor() : brushColor,
        brushAttrs = {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": strokeThickness,
            fill: "none",
            stroke: bColor,
        },
        animationId;

    paper.addEventListener('wheel', handleWheel);
    slider.setScrollListener(handleWheel);
    slider.setDisabled(true);

    setActive(tglGrid, showGrid);
    tglGrid.addEventListener("click", function () {
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
    });

    slider.onchange = function () {
        stopAnimation();
        let currentTime = parseInt(this.value);
        updateAnimation(currentTime);
        if (currentTime === 0) {
            btnClear.classList.add("disabled");
        } else {
            btnClear.classList.remove("disabled");
        }
        btnPlay.classList.remove("pause");
    };

    inpSymbol.addEventListener("input", onSymbolSet);
    function onSymbolSet() {
        clear();
        btnPlay.classList.add("disabled");
        slider.setDisabled(true);
        animationSegments.forEach((segment) => {
            segment.path?.remove();
        });
        animationSegments.length = 0;
        totalDuration = 0;

        const symbol = inpSymbol.value,
              kanji = JTOOLS.recognition.getKanji(symbol);

        if (!kanji) {
            return;
        }
        const paths = kanji.paths;

        paths.forEach((pathData, index) => {
            const path = svgElem(paper, "path").attrs({
                d: pathData,
                transform: "scale(2.629)",
                ...brushAttrs,
            });
            const length = path.getTotalLength();
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
            const duration = Math.ceil((length / PIXELS_PER_SECOND) * 1000);

            animationSegments.push({
                type: "path",
                start: totalDuration,
                end: totalDuration + duration,
                length,
                path: path
            });

            totalDuration += duration;

            if (index < paths.length - 1) {
                animationSegments.push({
                    type: "delay",
                    start: totalDuration,
                    end: totalDuration + DELAY_BETWEEN_PATHS,
                    duration: DELAY_BETWEEN_PATHS
                });
                totalDuration += DELAY_BETWEEN_PATHS;
            }
        });

        slider.setMaxValue(totalDuration);
        btnPlay.classList.remove("disabled");
        slider.setDisabled(false);
    }

    btnPlay.addEventListener("click", function () {
        if (this.classList.contains("pause")) {
            stopAnimation();
            this.classList.remove("pause");
            btnClear.classList.remove("disabled");
        } else if (slider.value > 0 && slider.value < totalDuration) {
            playAnimation();
            this.classList.add("pause");
            btnClear.classList.remove("disabled");
        } else {
            clear();
            playAnimation();
            btnClear.classList.remove("disabled");
            this.classList.add("pause");
        }
    });

    btnClear.addEventListener("click", function () {
        clear();
    });

    function clear() {
        stopAnimation();
        updateAnimation(0);
        slider.setValue(0, false);
        btnClear.classList.add("disabled");
        btnPlay.classList.remove("pause");
    }

    function updateAnimation(currentTime) {
        animationSegments.forEach(segment => {
            if (segment.type !== "path") return;

            const path = segment.path;
            if (currentTime >= segment.end) {
                path.style.strokeDashoffset = 0;
            } else if (currentTime >= segment.start) {
                const progress = (currentTime - segment.start) / (segment.end - segment.start);
                path.style.strokeDashoffset = segment.length * (1 - progress);
            } else {
                path.style.strokeDashoffset = segment.length;
            }
        });
    }

    function playAnimation() {
        let lastTimestamp = performance.now();

        function frame(timestamp) {
            const delta = timestamp - lastTimestamp;
            lastTimestamp = timestamp;

            let newValue = parseInt(slider.value) + delta;
            if (newValue >= totalDuration) {
                newValue = totalDuration;
            }

            slider.setValue(newValue, false);
            updateAnimation(newValue);

            if (newValue < totalDuration) {
                animationId = requestAnimationFrame(frame);
            } else {
                btnPlay.classList.remove("pause");
                btnClear.classList.remove("disabled");
            }
        }

        animationId = requestAnimationFrame(frame);
    }

    function stopAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }

    function handleWheel(e) {
        e.preventDefault();
        const currentTime = parseInt(slider.value);
        const direction = Math.sign(e.deltaY) * -1;

        if (currentTime === 0 && direction === -1 ||
            currentTime === totalDuration && direction === 1) {
            return;
        }

        let targetTime;
        let currentIndex = currentTime === totalDuration ? animationSegments.length - 1 :
            animationSegments.findIndex(s =>
                currentTime >= s.start && currentTime < s.end
            );

        if (animationSegments[currentIndex].type === "delay") {
            currentIndex += 1;
        }

        if (direction > 0 && currentIndex < animationSegments.length - 1) {
            targetTime = animationSegments[currentIndex + 2].start;
        } else if (direction < 0 && currentTime > animationSegments[currentIndex].start) {
            targetTime = animationSegments[currentIndex].start;
        } else if (direction < 0 && currentIndex > 0) {
            targetTime = animationSegments[currentIndex - 2].start;
        } else if (direction > 0) {
            targetTime = animationSegments[currentIndex].end;
        } else {
            return;
        }

        slider.setValue(targetTime);
        updateAnimation(targetTime);
        stopAnimation();
    }

    function setSymbol(symbol) {
        if (symbol) {
            inpSymbol.value = symbol;
            onSymbolSet();
        }
    }

    return {
        setSymbol: setSymbol
    }
}