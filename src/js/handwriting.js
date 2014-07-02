function Handwriting() {

    var storedGrid = localStorage.getItem("hw.grid"),
        storedUseContour = localStorage.getItem("hw.calligraphy"),
        storedNumbers = localStorage.getItem("hw.numbers"),
        storedColor = localStorage.getItem("hw.color"),
        storedBg = localStorage.getItem("hw.bg"),
        storedThickness = localStorage.getItem("hw.thickness"),
        storedSmoothing = localStorage.getItem("hw.smoothing"),

        canvas = document.getElementById("paper"),
        canvasWidth = canvas.clientWidth,
        canvasHeight = canvas.clientHeight,
        randomStrokesColors = storedColor && storedColor === "random",
        brushColor = !randomStrokesColors && storedColor ? storedColor : "#444",
        showGrid = storedGrid ? storedGrid == "true" : true,
        gridColor = "#000",
        gridSubdivideLevel = 3,
        gridContrast = 3,
        showStrokesNumbers = storedNumbers == "true",
        strokeNumberOffset = 20,
        numberFontSize = 16,
        useContour = storedUseContour ? storedUseContour == "true" : true, // true = calligraphic brush, false = simple path
        strokeThickness = storedThickness ? +storedThickness : 10,
        brushMass = storedSmoothing ? +storedSmoothing : 5,   // mass of brush. define brush inertia for smoothing

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
                var gridPath = paper.path(gridPathStr).toBack()
                    .attr({stroke: gridColor, "stroke-width": 1, "stroke-opacity": (1 / (factor * gridContrast))});
                gridLines.push(gridPath);
            }
            return gridLines;
        },
        round = function (value) {
            return (value * 100 ^ 0) / 100;
        },
        down = function (x, y, e) {
            if (e.which === 3) {
                if (stroke) {
                    stroke.wipe();
                    stroke = null;
                }
                return;
            }
            var bounds = canvas.getBoundingClientRect();

            // define new stroke on mousedown
            stroke = new Stroke({x: x - bounds.left, y: y - bounds.top});
        },
        move = function (dx, dy) {
            if (!stroke) return;

            stroke.addDot(dx, dy);
        },
        up = function (e) {
            if (e.which === 3 || !stroke) return;

            if (!stroke.validate()) {
                stroke.wipe();
                stroke = null;
                return;
            }

            strokes[++strokeIndex] = stroke;

            btnUndo.classList.remove("disabled");
            btnClear.classList.remove("disabled");

            stroke.draw();

            if (showStrokesNumbers) {
                stroke.drawNumber(strokeIndex + 1);
            }

            if (randomStrokesColors) {
                bColor = getRandomColor();
                updateBrushAttrs();
            }
        },
        undoStroke = function () {
            if (strokeIndex < 0) return;

            strokes[strokeIndex].wipe();
            strokeIndex -= 1;
            if (strokeIndex < 0) {
                btnUndo.classList.add("disabled");
                btnClear.classList.add("disabled");
            }
            if (strokeIndex < strokes.length - 1) {
                btnRedo.classList.remove("disabled");
            }
        },
        redoStroke = function () {
            var redoingStroke = strokes[strokeIndex + 1];
            if (redoingStroke) {
                strokeIndex += 1;
                redoingStroke.draw();
                if (showStrokesNumbers) {
                    redoingStroke.drawNumber(strokeIndex + 1);
                }
            }
            if (strokeIndex < strokes.length - 1) {
                btnRedo.classList.remove("disabled");
            } else {
                btnRedo.classList.add("disabled");
            }
        },
        removeAllStrokes = function () {
            for (var i = strokeIndex; i >= 0; i--) {
                strokes[i].wipe();
            }
            strokeIndex = -1;
            btnUndo.classList.add("disabled");
            btnClear.classList.add("disabled");
            if (strokeIndex < strokes.length - 1) {
                btnRedo.classList.remove("disabled");
            }
        },
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
            localStorage.setItem("hw.grid", showGrid);
        },
        toggleUseContour = function () {
            useContour = !useContour;
            brushAttrs = updateBrushAttrs();
            setActive(this, useContour);
            localStorage.setItem("hw.calligraphy", useContour);
        },
        toggleNumbers = function () {
            showStrokesNumbers = !showStrokesNumbers;
            for (var i = 0; i < strokes.length; i++) {
                if (showStrokesNumbers) {
                    strokes[i].drawNumber(i + 1);
                } else {
                    strokes[i].wipeNumber();
                }
            }
            setActive(this, showStrokesNumbers);
            localStorage.setItem("hw.numbers", showStrokesNumbers);
        },
        showColorPicker = function () {
            new ColorPicker().showAtElement(this, setBrushColor);
        },
        setBrushColor = function (color) {
            if (!color) return;

            if (color === "random") {
                btnColor.classList.add("randomColorIcon");
                btnColor.style.backgroundColor = "transparent";
                randomStrokesColors = true;
                bColor = getRandomColor();
            } else {
                btnColor.classList.remove("randomColorIcon");
                btnColor.style.backgroundColor = color;
                randomStrokesColors = false;
                bColor = Raphael.getRGB(color);
            }
            updateBrushAttrs();
            localStorage.setItem("hw.color", color);
        },
        showBgPicker = function () {
            var bounds = this.getBoundingClientRect(),
                bgPicker = JTOOLS.createPicker("bgPicker", "", bounds.left, this.offsetHeight + bounds.top);

            createBgButton("btnBgNone");
            createBgButton("btnBgPaper");
            createBgButton("btnBgBlackboard");

            function createBgButton(id) {
                var btn = document.createElement("button");
                btn.id = id;
                btn.className = id + " btnBg";
                btn.onclick = function () {
                    bgPicker.removePicker();
                    setBg(id);
                };
                bgPicker.appendChild(btn);
            }
        },
        setBg = function (className) {
            if (!className) return;
            canvas.className = className !== "btnBgNone" ? className : "";
            btnBg.className = className;
            localStorage.setItem("hw.bg", className);
        },
        setActive = function (elem, active) {
            var classes = elem.classList;
            if (active) {
                if (!classes.contains("active")) {
                    classes.add("active");
                }
            } else {
                if (classes.contains("active")) {
                    classes.remove("active");
                }
            }
        },
        changeThickness = function () {
            strokeThickness = sldThickness.value;
            brushAttrs = updateBrushAttrs();
            localStorage.setItem("hw.thickness", strokeThickness);
        },
        changeBrushMass = function () {
            brushMass = sldBrushMass.value;
            localStorage.setItem("hw.smoothing", brushMass);
        },
        getRandomColor = function () {
            // not too bright, not too dark
            var r = Math.floor(30 + 140 * Math.random()),
                g = Math.floor(30 + 140 * Math.random()),
                b = Math.floor(30 + 140 * Math.random());
            return Raphael.getRGB("rgb(" + r + "," + g + "," + b + ")");
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

        paper = Raphael(canvas, canvasWidth, canvasHeight),
        grid = showGrid ? drawGrid() : [],
        bColor = randomStrokesColors ? getRandomColor() : Raphael.getRGB(brushColor),
        brushAttrs = updateBrushAttrs(),
        strokes = [],
        stroke,            // now drawing stroke (on mouseup it will be pushed to strokes[])
        strokeIndex = -1,  // current stroke index (in strokes[])
        cel = paper.rect(0, 0, canvasWidth, canvasHeight, 0)	// front element, for all mousedrags
            .attr({fill: "#000", stroke: "none", "fill-opacity": 0, "stroke-width": 0})
            .drag(move, down, up).touchstart(down).touchmove(move).touchend(up),

        btnUndo = document.getElementById("btnUndo"),
        btnRedo = document.getElementById("btnRedo"),
        btnClear = document.getElementById("btnClear"),
        tglGrid = document.getElementById("tglGrid"),
        tglCalligraphy = document.getElementById("tglCalligraphy"),
        tglNumbers = document.getElementById("tglNumbers"),
        btnColor = document.getElementById("btnColor"),
        btnBg = document.getElementById("btnBg"),
        sldThickness = document.getElementById("sldThickness"),
        sldBrushMass = document.getElementById("sldBrushMass");

    sldThickness.setValue(strokeThickness);
    sldThickness.onchange = changeThickness;
    sldBrushMass.setValue(brushMass);
    sldBrushMass.onchange = changeBrushMass;

    btnUndo.onclick = undoStroke;
    btnRedo.onclick = redoStroke;
    btnClear.onclick = removeAllStrokes;
    tglGrid.onclick = toggleGrid;
    tglCalligraphy.onclick = toggleUseContour;
    tglNumbers.onclick = toggleNumbers;
    btnColor.onclick = showColorPicker;
    btnBg.onclick = showBgPicker;

    setActive(tglGrid, showGrid);
    setActive(tglCalligraphy, useContour);
    setActive(tglNumbers, showStrokesNumbers);
    setBrushColor(storedColor);
    setBg(storedBg);

    canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        undoStroke();
        return false;
    }, false);

    canvas.addEventListener("mousewheel", mouseScroll, false);
    canvas.addEventListener("DOMMouseScroll", mouseScroll, false);
    function mouseScroll(e) {
        var rolled = 0;
        if ('wheelDelta' in e) {
            rolled = e.wheelDelta;
        } else {
            rolled = -e.detail;
        }

        if (rolled > 0) {
            sldThickness.valueUp();
        } else {
            sldThickness.valueDown();
        }
        e.preventDefault();
        return false;
    }

    function Stroke(dot) {
        var dots = [dot],
            curr = dot,		// current dot
            prev = null,    // previous dot
            number = null,	// stroke number, drawn on showStrokesNumbers = true
            segments = [],  // accumulated stroke segments, delete on mouseup

        // for simple path
            pathStr = useContour ? null : "M" + dot.x + "," + dot.y + "L",
            path = null,

        // for contour (calligraphic brush)
            contour = null,
            nibSegment = useContour ? paper.path().attr(brushAttrs) : null,
            cDots1 = [],		// contour dots
            cDots2 = [],
            edgeCurve,
            tail,
            f = 1,			// stroke narrowing and widening factor

        //for smoothing
            v = {x: 0, y: 0};	// velocity

        this.addDot = addDot;
        this.validate = validate;
        this.draw = draw;
        this.drawNumber = drawNumber;
        this.wipe = wipe;
        this.wipeNumber = wipeNumber;

        function validate() {
            return dots.length > 2;
        }

        function addDot(dx, dy) {
            prev = curr;
            curr = smoothDot({x: dots[0].x + dx, y: dots[0].y + dy});
            dots.push(curr);

            if (useContour) {
                updateContour();
            } else {
                updatePath();
            }
        }

        function draw() {
            if (useContour) {
                drawContour();
                nibSegment.remove();
            } else {
                drawPath();
            }
            deleteSegments();

            cel.toFront();
        }

        function wipe() {
            if (nibSegment) nibSegment.remove();
            if (contour) contour.remove();
            if (path) path.remove();
            if (number) number.remove();
        }

        function wipeNumber() {
            if (number) number.remove();
        }

        function deleteSegments() {
            for (var i = segments.length - 1; i >= 0; i--) {
                segments.pop().remove();
            }
        }

        function smoothDot(dot) {
            v.x += (dot.x - curr.x) / brushMass;
            v.y += (dot.y - curr.y) / brushMass;

            v.x *= .5;
            v.y *= .5;

            return {x: curr.x + v.x, y: curr.y + v.y};
        }


        function updateContour() {
            var s = (prev.x - prev.y < curr.x - curr.y) ? 1 : -1,
                angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);

            if (cDots1.length == 0) { // cDots2 check is not nessessary, I believe...
                cDots1.push({x: prev.x - strokeThickness * s / 4, y: prev.y - strokeThickness * s / 4});
                cDots2.push({x: prev.x + strokeThickness * s / 4, y: prev.y + strokeThickness * s / 4});
            }

            // narrowing and widening of stroke on certain angle range
            if (angle > 5 * Math.PI / 9 || angle < -Math.PI / 9) {
                f = (f > .1) ? f - f * .05 : f;
            } else if (angle > Math.PI / 9 && angle < 7 * Math.PI / 18) {
                // oscillating stroke tip is really annoying,
                // but I can't find a better solution
                f = (f < 1.5) ? f + f * .05 : f;
            } else {
                f = (f < 1) ? f + f * .05 : (f > 1) ? f - f * .05 : 1;
            }

            var s1 = cDots1[cDots1.length - 1],
                s2 = cDots2[cDots2.length - 1],
                e1 = {x: curr.x - strokeThickness * s * f / 4, y: curr.y - strokeThickness * s * f / 4},
                e2 = {x: curr.x + strokeThickness * s * f / 4, y: curr.y + strokeThickness * s * f / 4},
                ox = strokeThickness / 14,
                oy = strokeThickness / 20,
                t = (segments.length == 0)
                    ? "C" + round(s2.x - ox * s) + "," + round(s2.y + oy * s) + " "
                    + round(s1.x - ox * s) + "," + round(s1.y + oy * s) + " " + s1.x + "," + s1.y + "z"
                    : " " + s1.x + "," + s1.y + "z",
                segment = "M" + s1.x + "," + s1.y +
                    "L" + e1.x + "," + e1.y + " " + e2.x + "," + e2.y + " " + s2.x + "," + s2.y + t;

            edgeCurve = "C" + round(e1.x + ox * s) + "," + round(e1.y - oy * s) + " "
                + round(e2.x + ox * s) + "," + round(e2.y - oy * s) + " " + e2.x + "," + e2.y;

            if (segments.length == 0) {
                tail = t;
            }
            nibSegment.attr({path: "M" + e1.x + "," + e1.y + edgeCurve + "z"});
            segments.push(paper.path(segment).attr(brushAttrs));
            cDots1.push(e1);
            cDots2.push(e2);
        }

        function updatePath() {
            var segment = "M" + prev.x + "," + prev.y + "L" + curr.x + "," + curr.y;

            pathStr += round(curr.x) + "," + round(curr.y) + " ";
            segments.push(paper.path(segment).attr(brushAttrs));
        }

        function drawContour() {
            var d1 = cDots1,
                d2 = cDots2,
                path = "M" + d1[0].x + "," + d1[0].y + "L",
                i;
            for (i = 0; i < d1.length; i++) {
                path += round(d1[i].x) + "," + round(d1[i].y) + " ";
            }
            path += edgeCurve + "L";
            for (i = d2.length - 1; i >= 0; i--) {
                path += round(d2[i].x) + "," + round(d2[i].y) + " ";
            }
            path += tail;
            contour = paper.path(path).attr(brushAttrs);
        }

        function drawPath() {
            path = paper.path(pathStr).attr(brushAttrs);
        }

        function drawNumber(num) {
            var firstDot = dots[0],
                auxDot = dots.length > 5 ? dots[5] : dots[dots.length - 1],
                atan = Math.atan2(auxDot.y - firstDot.y, auxDot.x - firstDot.x),
                nx = firstDot.x - strokeNumberOffset * Math.cos(atan),
                ny = firstDot.y - strokeNumberOffset * Math.sin(atan);

            number = paper.text(nx, ny, num);

            var brightnessAdjust = randomStrokesColors ? 1.5 : 1,
                hsb = Raphael.rgb2hsb(bColor.r, bColor.g, bColor.b),
                numberColor = Raphael.getRGB(Raphael.hsb(hsb.h, hsb.s, hsb.b / brightnessAdjust));

            number.attr({stroke: "none", fill: numberColor, "font-size": numberFontSize});
        }
    }
}