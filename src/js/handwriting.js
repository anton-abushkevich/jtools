"use strict";

function Handwriting(strokeDrawnHandler) {

    var storedGrid = localStorage.getItem("hw.grid"),
        storedUseContour = localStorage.getItem("hw.calligraphy"),
        storedNumbers = localStorage.getItem("hw.numbers"),
        storedColor = localStorage.getItem("hw.color"),
        storedBg = localStorage.getItem("hw.bg"),
        storedThickness = localStorage.getItem("hw.thickness"),
        storedSmoothing = localStorage.getItem("hw.smoothing"),

        canvas = document.getElementById("recogPaper"),
        canvasWidth = canvas.clientWidth,
        canvasHeight = canvas.clientHeight,
        svgElem = JTOOLS.utils.svgElem,
        setActive = JTOOLS.utils.setActive,
        randomStrokesColors = storedColor && storedColor === "random",
        brushColor = !randomStrokesColors && storedColor ? storedColor : "#444",
        showGrid = storedGrid ? storedGrid === "true" : true,
        showStrokesNumbers = storedNumbers === "true",
        strokeNumberOffset = 20,
        numberFontSize = 16,
        useContour = storedUseContour ? storedUseContour === "true" : true, // true = calligraphic brush, false = simple path
        strokeThickness = storedThickness ? +storedThickness : 10,
        brushMass = storedSmoothing ? +storedSmoothing : 5,   // mass of brush. define brush inertia for smoothing

        drawGrid = () => JTOOLS.utils.drawGrid(paper, canvasWidth, canvasHeight),
        undoStroke = function () {
            if (strokeIndex < 0 || stroke) return;

            strokes[strokeIndex].wipe();
            strokeIndex -= 1;
            updateUndoRedoIcons();
            onStrokeDrawn();
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
            updateUndoRedoIcons();
            onStrokeDrawn();
        },
        updateUndoRedoIcons = function () {
            if (strokeIndex < 0) {
                btnUndo.classList.add("disabled");
                btnClear.classList.add("disabled");
            } else {
                btnUndo.classList.remove("disabled");
                btnClear.classList.remove("disabled");
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
            updateUndoRedoIcons();
            onStrokeDrawn();
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
            for (var i = 0; i <= strokeIndex; i++) {
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
                bColor = color;
            }
            updateBrushAttrs();
            localStorage.setItem("hw.color", color);
        },
        showBgPicker = () => JTOOLS.utils.showBgPicker(btnBg, setBg),
        setBg = (className) => JTOOLS.utils.setBg(canvas, className, btnBg, "hw.bg"),
        changeThickness = function () {
            strokeThickness = sldThickness.value;
            brushAttrs = updateBrushAttrs();
            localStorage.setItem("hw.thickness", strokeThickness);
        },
        changeBrushMass = function () {
            brushMass = sldBrushMass.value;
            localStorage.setItem("hw.smoothing", brushMass);
        },
        getRandomColor = JTOOLS.utils.getRandomColor,
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
        shallowClone = function (obj) {
            if (obj == null || typeof(obj) !== 'object') return obj;

            var clone = obj.constructor();
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clone[key] = obj[key];
                }
            }
            return clone;
        },
        assembleStrokesData = function () {
            var dots, strokesData = [];
            for (var i = 0; i <= strokeIndex; i++) {
                dots = strokes[i].dots;
                strokesData.push([dots[0].x, dots[0].y, dots[dots.length - 1].x, dots[dots.length - 1].y]);
            }
            return strokesData;
        },
        onStrokeDrawn = function () {
            strokeDrawnHandler(assembleStrokesData());
        },

        paper = svgElem(canvas, "svg").attrs({width: canvasWidth, height: canvasHeight, version: "1.1",
            style: "overflow: hidden; position: relative;"}).child("desc", "JTOOLS").child("defs"),
        grid = showGrid ? drawGrid() : [],
        bColor = randomStrokesColors ? getRandomColor() : brushColor,
        brushAttrs = updateBrushAttrs(),
        strokes = [],
        stroke,            // now drawing stroke (on mouseup it must be pushed to strokes[] and assign to null)
        strokeIndex = -1,  // current stroke index (in strokes[])
        cel = svgElem(paper, "rect").attrs({width: canvasWidth, height: canvasHeight, 	// front element, for all mousedrags
            fill: "#000", stroke: "none", "fill-opacity": 0, "stroke-width": 0}),

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

    cel.onmousedown = function (e) {
        if (e.which !== 1) return;
        var bounds = canvas.getBoundingClientRect();

        // define new stroke on mousedown
        stroke = new Stroke({x: e.clientX - bounds.left, y: e.clientY - bounds.top});

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);

        return false;

        function move(e) {
            if (e.which !== 1 || !stroke) return;
            stroke.addDot({x: e.clientX - bounds.left, y: e.clientY - bounds.top});
        }

        function up(e) {
            if (e.which !== 1 || !stroke) return;

            if (!stroke.validate()) {
                stroke.wipe();
                stroke = null;
                removeListeners();
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

            if (strokeIndex === strokes.length - 1) {
                btnRedo.classList.add("disabled");
            }

            stroke = null;

            onStrokeDrawn();
            removeListeners();
        }

        function removeListeners() {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
        }
    };

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
            curr = dot,	        // current dot
            prev = null,        // previous dot
            number = null,	    // stroke number, drawn on showStrokesNumbers = true
            segments = [],      // accumulated stroke segments, delete on mouseup
            ba = shallowClone(brushAttrs),   // save current brush attributes

        // for simple path
            pathStr = useContour ? null : "M" + dot.x + "," + dot.y + "L",
            path = null,

        // for contour (calligraphic brush)
            contour = null,
            nibSegment = useContour ? svgElem(paper, "path").attrs(ba) : null,
            cDots1 = [],		// contour dots
            cDots2 = [],
            edgeCurve,
            tail,
            f = 1,			    // stroke narrowing and widening factor

        //for smoothing
            v = {x: 0, y: 0};   // velocity

        this.dots = dots;
        this.addDot = addDot;
        this.validate = validate;
        this.draw = draw;
        this.drawNumber = drawNumber;
        this.wipe = wipe;
        this.wipeNumber = wipeNumber;

        function validate() {
            return dots.length > 2;
        }

        function addDot(dot) {
            prev = curr;
            curr = smoothDot(dot);
            dots.push(curr);

            if (useContour) {
                updateContour();
            } else {
                updatePath();
            }
        }

        function draw() {
            if (pathStr) {
                drawPath();
            } else {
                drawContour();
                nibSegment = nibSegment && nibSegment.remove();
            }
            deleteSegments();

            cel.toFront();
        }

        function wipe() {
            nibSegment = nibSegment && nibSegment.remove();
            contour = contour && contour.remove();
            path = path && path.remove();
            number = number && number.remove();
            deleteSegments();
        }

        function wipeNumber() {
            number = number && number.remove();
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

            if (cDots1.length === 0) { // cDots2 check is not nessessary, I believe...
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
                t = (segments.length === 0)
                    ? "C" + (s2.x - ox * s) + "," + (s2.y + oy * s) + " "
                    + (s1.x - ox * s) + "," + (s1.y + oy * s) + " " + s1.x + "," + s1.y + "z"
                    : " " + s1.x + "," + s1.y + "z",
                segment = "M" + s1.x + "," + s1.y +
                    "L" + e1.x + "," + e1.y + " " + e2.x + "," + e2.y + " " + s2.x + "," + s2.y + t;

            edgeCurve = "C" + (e1.x + ox * s) + "," + (e1.y - oy * s) + " "
                + (e2.x + ox * s) + "," + (e2.y - oy * s) + " " + e2.x + "," + e2.y;

            if (segments.length === 0) {
                tail = t;
            }
            nibSegment.attrs({d: "M" + e1.x + "," + e1.y + edgeCurve + "z"});
            segments.push(svgElem(paper, "path").attrs(ba).attrs({d: segment}));
            cDots1.push(e1);
            cDots2.push(e2);
        }

        function updatePath() {
            var segment = "M" + prev.x + "," + prev.y + "L" + curr.x + "," + curr.y;

            pathStr += curr.x + "," + curr.y + " ";
            segments.push(svgElem(paper, "path").attrs(ba).attrs({d: segment}));
        }

        function drawContour() {
            var d1 = cDots1,
                d2 = cDots2,
                path = "M" + d1[0].x + "," + d1[0].y + "L",
                i;
            for (i = 0; i < d1.length; i++) {
                path += d1[i].x + "," + d1[i].y + " ";
            }
            path += edgeCurve + "L";
            for (i = d2.length - 1; i >= 0; i--) {
                path += d2[i].x + "," + d2[i].y + " ";
            }
            path += tail;
            contour = svgElem(paper, "path").attrs(ba).attrs({d: path});
        }

        function drawPath() {
            path = svgElem(paper, "path").attrs(ba).attrs({d: pathStr});
        }

        function drawNumber(num) {
            var auxDot = dots.length > 5 ? dots[5] : dots[dots.length - 1],
                atan = Math.atan2(auxDot.y - dot.y, auxDot.x - dot.x),      // dot - initial dot
                nx = dot.x - strokeNumberOffset * Math.cos(atan),
                ny = dot.y - strokeNumberOffset * Math.sin(atan);

            number = svgElem(paper, "text")
                .attrs({x: nx, y: ny, stroke: "none", fill: ba.stroke, "font-size": numberFontSize,
                    style: "text-anchor: middle; font: " + numberFontSize + "px Arial"})
                .child("tspan", num);
            cel.toFront();
        }
    }
}