"use strict";

function Kakijun() {

    const SCALE = 2.629;
    const DEFAULT_THICKNESS = 4.5;
    const DEFAULT_SPEED = 5;
    const SPEED_MULTIPLIER = 18;
    const DELAY_BASE = 20; // delay between paths ~ speed of 20px-length stroke

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
        strokeNumberOffset = 20,
        numberFontSize = 16,
        inpSymbol = document.getElementById("kakijunInput"),
        sldProgress = document.getElementById("kakijunProgress"),
        sldThickness = document.getElementById("kakijunThickness"),
        sldSpeed = document.getElementById("kakijunSpeed"),
        btnPlay = document.getElementById("btnKakijunPlay"),
        btnClear = document.getElementById("btnKakijunClear"),
        tglGrid = document.getElementById("tglKakijunGrid"),
        tglNumbers = document.getElementById("tglKakijunNumbers"),
        btnColor = document.getElementById("btnKakijunColor"),
        btnBg = document.getElementById("btnKakijunBg"),
        strokesAndDelays = [];

    let storedGrid = localStorage.getItem("kj.grid"),
        storedNumbers = localStorage.getItem("kj.numbers"),
        storedColor = localStorage.getItem("kj.color"),
        storedBg = localStorage.getItem("kj.bg"),
        storedThickness = localStorage.getItem("kj.thickness"),
        storedSpeed = localStorage.getItem("kj.speed"),
        randomStrokesColors = storedColor && storedColor === "random",
        brushColor = randomStrokesColors ? getRandomColor() : (storedColor || "#555"),
        showGrid = storedGrid ? storedGrid === "true" : true,
        showStrokesNumbers = storedNumbers === "true",
        setBg = (className) => JTOOLS.utils.setBg(canvas, className, btnBg, "kj.bg"),
        showBgPicker = () => JTOOLS.utils.showBgPicker(btnBg, setBg),
        strokeThickness = storedThickness ? +storedThickness : DEFAULT_THICKNESS,
        speed = storedSpeed ? +storedSpeed : DEFAULT_SPEED,
        totalDuration = 0,
        grid = showGrid ? drawGrid() : [],
        brushAttrs = {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": strokeThickness,
            fill: "none",
        },
        animationId;

    paper.addEventListener("wheel", handleWheel);
    sldProgress.setScrollListener(handleWheel);
    sldProgress.setDisabled(true);

    sldThickness.setValue(strokeThickness);
    sldThickness.onchange = function () {
        strokeThickness = sldThickness.value;
        brushAttrs["stroke-width"] = strokeThickness;
        strokesAndDelays.forEach(segment => {
            if (segment.type === "stroke") {
                segment.path.attrs({"stroke-width": strokeThickness});
            }
        });
        localStorage.setItem("kj.thickness", strokeThickness);
    };

    sldSpeed.setValue(speed);
    sldSpeed.onchange = function () {
        speed = sldSpeed.value;
        localStorage.setItem("kj.speed", speed);
    };

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

    setActive(tglNumbers, showStrokesNumbers);
    tglNumbers.addEventListener("click",function () {
        showStrokesNumbers = !showStrokesNumbers;
        strokesAndDelays.forEach(segment => {
            if (segment.type === "stroke") {
                if (showStrokesNumbers &&
                    parseInt(segment.path.style.strokeDashoffset) !== segment.length) {
                    segment.numberElem.style.display = "block";
                } else {
                    segment.numberElem.style.display = "none";
                }
            }
        });
        setActive(this, showStrokesNumbers);
        localStorage.setItem("kj.numbers", showStrokesNumbers);
    });

    if (randomStrokesColors) {
        btnColor.classList.add("randomColorIcon");
    } else {
        btnColor.style.backgroundColor = brushColor;
    }
    btnColor.addEventListener("click", function () {
        new ColorPicker().showAtElement(this, (color) => {
            if (!color) return;

            if (color === "random") {
                btnColor.classList.add("randomColorIcon");
                btnColor.style.backgroundColor = "transparent";
                randomStrokesColors = true;
            } else {
                btnColor.classList.remove("randomColorIcon");
                btnColor.style.backgroundColor = color;
                randomStrokesColors = false;
                brushColor = color;
            }
            strokesAndDelays.forEach(segment => {
                if (segment.type === "stroke") {
                    if (randomStrokesColors) {
                        brushColor = getRandomColor();
                    }
                    segment.path.attrs({stroke: brushColor});
                    segment.numberElem.attrs({fill: brushColor});
                }
            });
            localStorage.setItem("kj.color", color);
        });
    });

    setBg(storedBg);
    btnBg.addEventListener("click", showBgPicker);

    sldProgress.onchange = function () {
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
    async function onSymbolSet() {
        clear();
        btnPlay.classList.add("disabled");
        sldProgress.setDisabled(true);
        strokesAndDelays.forEach((segment) => {
            segment.path?.remove();
            segment.numberElem?.remove();
        });
        strokesAndDelays.length = 0;
        totalDuration = 0;

        const symbol = inpSymbol.value,
              paths = await JTOOLS.kanjiData.getKanjiPaths(symbol);

        if (!paths) {
            inpSymbol.value = "";
            return;
        }

        paths.forEach((pathData, index) => {
            if (randomStrokesColors) {
                brushColor = getRandomColor();
            }
            const path = svgElem(paper, "path").attrs({
                d: pathData,
                transform: "scale(" + SCALE + ")",
                stroke: brushColor,
                ...brushAttrs,
            });
            const length = Math.ceil(path.getTotalLength());
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
            const duration = 1000 * length;
            strokesAndDelays.push({
                type: "stroke",
                start: totalDuration,
                end: totalDuration + duration,
                length,
                path: path,
                numberElem: prepareNumber(path, index + 1, brushColor)
            });

            totalDuration += duration;
            let delay = 1000 * DELAY_BASE;

            if (index < paths.length - 1) {
                strokesAndDelays.push({
                    type: "delay",
                    start: totalDuration,
                    end: totalDuration + delay
                });
                totalDuration += delay;
            }
        });

        sldProgress.setMaxValue(totalDuration);
        btnPlay.classList.remove("disabled");
        sldProgress.setDisabled(false);
    }

    btnPlay.addEventListener("click", function () {
        if (this.classList.contains("pause")) {
            stopAnimation();
            this.classList.remove("pause");
            btnClear.classList.remove("disabled");
        } else if (sldProgress.value > 0 && sldProgress.value < totalDuration) {
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
        sldProgress.setValue(0, false);
        btnClear.classList.add("disabled");
        btnPlay.classList.remove("pause");
    }

    function updateAnimation(currentTime) {
        strokesAndDelays.forEach(segment => {
            if (segment.type !== "stroke") return;

            const path = segment.path;
            if (currentTime >= segment.end) {
                path.style.strokeDashoffset = 0;
                if (showStrokesNumbers) {
                    segment.numberElem.style.display = "block";
                }
            } else if (currentTime >= segment.start) {
                const progress = (currentTime - segment.start) / (segment.end - segment.start);
                path.style.strokeDashoffset = segment.length * (1 - progress);
                if (showStrokesNumbers && currentTime > segment.start) {
                    segment.numberElem.style.display = "block";
                } else {
                    segment.numberElem.style.display = "none";
                }
            } else {
                path.style.strokeDashoffset = segment.length;
                segment.numberElem.style.display = "none";
            }
        });
    }

    function playAnimation() {
        let lastTimestamp = performance.now();

        function frame(timestamp) {
            const delta = (timestamp - lastTimestamp) * speed * SPEED_MULTIPLIER;
            lastTimestamp = timestamp;

            let newValue = parseInt(sldProgress.value) + delta;
            if (newValue >= totalDuration) {
                newValue = totalDuration;
            }

            sldProgress.setValue(newValue, false);
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
        const currentTime = parseInt(sldProgress.value);
        const direction = Math.sign(e.deltaY);

        if (currentTime === 0 && direction === -1 ||
            currentTime === totalDuration && direction === 1) {
            return;
        }

        let targetTime;
        let currentIndex = currentTime === totalDuration ? strokesAndDelays.length - 1 :
            strokesAndDelays.findIndex(s =>
                currentTime >= s.start && currentTime < s.end
            );

        if (strokesAndDelays[currentIndex].type === "delay") {
            currentIndex += 1;
        }

        if (direction > 0 && currentIndex < strokesAndDelays.length - 1) {
            targetTime = strokesAndDelays[currentIndex + 2].start;
        } else if (direction < 0 && currentTime > strokesAndDelays[currentIndex].start) {
            targetTime = strokesAndDelays[currentIndex].start;
        } else if (direction < 0 && currentIndex > 0) {
            targetTime = strokesAndDelays[currentIndex - 2].start;
        } else if (direction > 0) {
            targetTime = strokesAndDelays[currentIndex].end;
        } else {
            return;
        }

        sldProgress.setValue(targetTime);
        updateAnimation(targetTime);
        stopAnimation();
    }

    function prepareNumber(path, number, color) {
        const start = path.getPointAtLength(0);
        const next = path.getPointAtLength(5);
        const atan = Math.atan2(next.y - start.y, next.x - start.x);
        const x = start.x * SCALE - strokeNumberOffset * Math.cos(atan);
        const y = start.y * SCALE - strokeNumberOffset * Math.sin(atan);

        return svgElem(paper, "text")
            .attrs({x: x, y: y, stroke: "none", fill: color,
                "font-size": numberFontSize,
                style: "text-anchor: middle; font: " + numberFontSize + "px Arial; display: none"})
            .child("tspan", number);
    }

    function setSymbol(symbol) {
        if (symbol) {
            inpSymbol.value = symbol;
            onSymbolSet();
        }
    }

    return { setSymbol }
}