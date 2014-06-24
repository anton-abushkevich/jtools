function Handwriting() {

    var canvas = document.getElementById("paper"),
        canvasWidth = canvas.clientWidth,
        canvasHeight = canvas.clientHeight,
        paperColor = "#fff",
        paperOpacity = 1,
        brushColor = "#444",			// default strokes color
        randomStrokesColors = false,	// if true, ignore brushColor and assign random color to each stroke
        strokeThickness = 10,
        showGrid = true,
        gridColor = "#000",
        gridSubdivideLevel = 3,
        gridContrast = 3,
        showStrokesNumbers = false,
        strokeNumberOffset = 20,
        numberFontSize = 16,
        useContour = true,				// true = caligraphic brush, false = simple path
        brushMass = 5,					// mass of brush. define brush inertia for smoothing

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
            bg.toBack();
            return gridLines;
        },
        round = function (value) {
            return (value * 100 ^ 0) / 100;
        },
        down = function (x, y, e) {
            if (e.which === 3) {
                stroke = null;
                return;
            }
            var bounds = canvas.getBoundingClientRect(),
                x0 = x - bounds.left,
                y0 = y - bounds.top,
                dot = {x: x0, y: y0};

            // define new stroke on mousedown
            stroke = {
                dots: [dot],
                curr: dot,		// current dot
                prev: null,		// previous dot
                number: null,	// stroke number, drawn on showStrokesNumbers = true

                // accumulated stroke segments, delete on mouseup
                segments: [],

                // for simple path
                pathStr: useContour ? null : "M" + x0 + "," + y0 + "L",
                path: useContour ? null : paper.path().attr(brushAttrs),

                // for contour (calligraphic brush)
                contour: useContour ? paper.path().attr(brushAttrs) : null,
                nibSegment: useContour ? paper.path().attr(brushAttrs) : null,
                cDots1: [],		// contour dots
                cDots2: [],
                f: 1,			// stroke narrowing and widening factor

                //for smoothing
                v: {x: 0, y: 0},	// velocity

                //for cleaning
                deleteSegments: function () {
                    for (var i = this.segments.length - 1; i >= 0; i--) {
                        this.segments.pop().remove();
                    }
                },
                destroy: function () {
                    if (this.nibSegment) this.nibSegment.remove();
                    if (this.contour) this.contour.remove();
                    if (this.pathStr) this.pathStr = null;
                    if (this.path) this.path.remove();
                    if (this.number) this.number.remove();
                }
            };
        },
        move = function (dx, dy, x, y, e) {
            if (stroke === null) return;

            stroke.prev = stroke.curr;
            stroke.curr = smoothDot({x: stroke.dots[0].x + dx, y: stroke.dots[0].y + dy});
            stroke.dots.push(stroke.curr);

            if (useContour) {
                updateContour();
            } else {
                updatePath();
            }
        },
        up = function (e) {
            if (e.which === 3) return;

            if (stroke.dots.length < 2) {
                stroke.destroy();
                return;
            }

            strokes.push(stroke);
            if (showStrokesNumbers) {
                drawNumber(stroke, strokes.length);
            }
            cel.toFront();

            if (useContour) {
                drawContour();
                stroke.nibSegment.remove();
            } else {
                drawPath();
            }
            stroke.deleteSegments();

            if (randomStrokesColors) {
                bColor = getRandomColor();
                brushAttrs.fill = brushAttrs.stroke = bColor;
            }
        },
        smoothDot = function (dot) {
            stroke.v.x += (dot.x - stroke.curr.x) / brushMass;
            stroke.v.y += (dot.y - stroke.curr.y) / brushMass;

            stroke.v.x *= .5;
            stroke.v.y *= .5;

            return {x: stroke.curr.x + stroke.v.x, y: stroke.curr.y + stroke.v.y};
        },
        updateContour = function () {
            var curr = stroke.curr,
                prev = stroke.prev,
                s = (prev.x - prev.y < curr.x - curr.y) ? 1 : -1,
                angle = Math.atan2(curr.y - prev.y, curr.x - prev.x),
                f = stroke.f;

            if (stroke.cDots1.length == 0) { // cDots2 check is not nessessary, I believe...
                stroke.cDots1.push({x: prev.x - strokeThickness * s / 4, y: prev.y - strokeThickness * s / 4});
                stroke.cDots2.push({x: prev.x + strokeThickness * s / 4, y: prev.y + strokeThickness * s / 4});
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

            var s1 = stroke.cDots1[stroke.cDots1.length - 1],
                s2 = stroke.cDots2[stroke.cDots2.length - 1],
                e1 = {x: curr.x - strokeThickness * s * f / 4, y: curr.y - strokeThickness * s * f / 4},
                e2 = {x: curr.x + strokeThickness * s * f / 4, y: curr.y + strokeThickness * s * f / 4},
                ox = strokeThickness / 14,
                oy = strokeThickness / 20,
                tail = (stroke.segments.length == 0)
                    ? "C" + round(s2.x - ox * s) + "," + round(s2.y + oy * s) + " "
                    + round(s1.x - ox * s) + "," + round(s1.y + oy * s) + " "
                    + s1.x + "," + s1.y + "z"
                    : " " + s1.x + "," + s1.y + "z",
                segment = "M" + s1.x + "," + s1.y +
                    "L" + e1.x + "," + e1.y + " " + e2.x + "," + e2.y + " " + s2.x + "," + s2.y + tail,
                edgeCurve = "C" + round(e1.x + ox * s) + "," + round(e1.y - oy * s) + " "
                    + round(e2.x + ox * s) + "," + round(e2.y - oy * s) + " "
                    + e2.x + "," + e2.y,
                edge = "M" + e1.x + "," + e1.y + edgeCurve + "z";

            stroke.edgeCurve = edgeCurve;
            if (stroke.segments.length == 0) {
                stroke.tail = tail;
            }
            stroke.nibSegment.attr({path: edge});
            stroke.segments.push(paper.path(segment).attr(brushAttrs));
            stroke.cDots1.push(e1);
            stroke.cDots2.push(e2);
            stroke.f = f;
        },
        updatePath = function () {
            var segment = "M" + stroke.prev.x + "," + stroke.prev.y +
                "L" + stroke.curr.x + "," + stroke.curr.y;
            stroke.pathStr += round(stroke.curr.x) + "," + round(stroke.curr.y) + " ";
            stroke.segments.push(paper.path(segment).attr(brushAttrs));
        },
        drawContour = function () {
            var d1 = stroke.cDots1,
                d2 = stroke.cDots2,
                path = "M" + d1[0].x + "," + d1[0].y + "L";
            for (var i = 0; i < d1.length; i++) {
                path += round(d1[i].x) + "," + round(d1[i].y) + " ";
            }
            path += stroke.edgeCurve + "L";
            for (var i = d2.length - 1; i >= 0; i--) {
                path += round(d2[i].x) + "," + round(d2[i].y) + " ";
            }
            path += stroke.tail;
            stroke.contour.attr({path: path});
        },
        drawPath = function () {
            stroke.path.attr({path: stroke.pathStr});
        },
        drawNumber = function (stroke, num) {
            var dots = stroke.dots,
                firstDot = dots[0],
                auxDot = dots.length > 5 ? dots[5] : dots[dots.length - 1],
                atan = Math.atan2(auxDot.y - firstDot.y, auxDot.x - firstDot.x),
                nx = firstDot.x - strokeNumberOffset * Math.cos(atan),
                ny = firstDot.y - strokeNumberOffset * Math.sin(atan);

            stroke.number = paper.text(nx, ny, num);

            var brightnessAdjust = randomStrokesColors ? 1.5 : 1,
                hsb = Raphael.rgb2hsb(bColor.r, bColor.g, bColor.b),
                numberColor = Raphael.getRGB(Raphael.hsb(hsb.h, hsb.s, hsb.b / brightnessAdjust));

            stroke.number.attr({stroke: "none", fill: numberColor, "font-size": numberFontSize});
        },
        removeLastStroke = function () {
            if (strokes.length > 0) {
                strokes.pop().destroy();
            }
        },
        removeAllStrokes = function () {
            for (var i = strokes.length - 1; i >= 0; i--) {
                strokes.pop().destroy();
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
        },
        toggleUseContour = function () {
            useContour = !useContour;
            brushAttrs = updateBrushAttrs();
            setActive(this, useContour);
        },
        toggleNumbers = function () {
            showStrokesNumbers = !showStrokesNumbers;
            for (var i = 0; i < strokes.length; i++) {
                if (showStrokesNumbers) {
                    drawNumber(strokes[i], i + 1);
                } else if (strokes[i].number) {
                    strokes[i].number.remove();
                }
            }
            setActive(this, showStrokesNumbers);
        },
        showColorPicker = function() {
            new ColorPicker().showAtElement(this, function(color) {
                if(color === "random") {
                    btnColor.classList.add("randomColorIcon");
                    btnColor.style.backgroundColor = "transparent";
                    btnColor.style.border = "1px solid transparent";
                    randomStrokesColors = true;
                    brushAttrs.fill = brushAttrs.stroke = getRandomColor();
                } else {
                    btnColor.classList.remove("randomColorIcon");
                    btnColor.style.backgroundColor = color;
                    btnColor.style.border = "5px solid #FFF";
                    randomStrokesColors = false;
                    brushAttrs.fill = brushAttrs.stroke = Raphael.getRGB(color);
                }
            });
        },
        setActive = function(elem, active) {
            var classes = elem.classList;
            if(active) {
                if(!classes.contains("active")) {
                    classes.add("active");
                }
            } else {
                if(classes.contains("active")) {
                    classes.remove("active");
                }
            }
        },
        changeThickness = function () {
            strokeThickness = sldThickness.value;
            brushAttrs = updateBrushAttrs();
        },
        changeBrushMass = function () {
            brushMass = sldBrushMass.value;
        },
        getRandomColor = function () {
            // not too bright, not too dark
            var r = Math.floor(30 + 140 * Math.random()),
                g = Math.floor(30 + 140 * Math.random()),
                b = Math.floor(30 + 140 * Math.random());
            return Raphael.getRGB("rgb(" + r + "," + g + "," + b + ")");
        },
        updateBrushAttrs = function () {
            return useContour ?
            {
                fill: bColor,
                stroke: bColor,
                "stroke-width": strokeThickness / 2,
                "stroke-linecap": "round",
                "stroke-linejoin": "round"
            } :
            {
                fill: "none",
                stroke: bColor,
                "stroke-width": strokeThickness,
                "stroke-linecap": "round",
                "stroke-linejoin": "round"
            };
        },
        paper = Raphael(canvas, canvasWidth, canvasHeight),
        bg = paper.rect(0, 0, canvasWidth, canvasHeight, 0)
            .attr({fill: paperColor, stroke: "none", "fill-opacity": (1 - paperOpacity)}),
        grid = showGrid ? drawGrid() : [],
        bColor = randomStrokesColors ? getRandomColor() : Raphael.getRGB(brushColor),
        brushAttrs = updateBrushAttrs(),
        strokes = [],
        stroke = null,				// current stroke
        cel = paper.rect(0, 0, canvasWidth, canvasHeight, 0)	// front element, for all mousedrags
            .attr({fill: "#000", stroke: "none", "fill-opacity": 0, "stroke-width": 0})
            .drag(move, down, up).touchstart(down).touchmove(move).touchend(up),
        filter = null,

        btnUndo = document.getElementById("btnUndo"),
        btnRedo = document.getElementById("btnRedo"),
        btnClear = document.getElementById("btnClear"),
        tglGrid = document.getElementById("tglGrid"),
        tglCalligraphy = document.getElementById("tglCalligraphy"),
        tglNumbers = document.getElementById("tglNumbers"),
        btnColor = document.getElementById("btnColor"),
        sldThickness = document.getElementById("sldThickness"),
        sldBrushMass = document.getElementById("sldBrushMass");

    sldThickness.setValue(strokeThickness);
    sldThickness.onchange = changeThickness;
    sldBrushMass.setValue(brushMass);
    sldBrushMass.onchange = changeBrushMass;

    btnUndo.onclick = removeLastStroke;
    btnRedo.onclick = removeLastStroke;
    btnClear.onclick = removeAllStrokes;
    tglGrid.onclick = toggleGrid;
    tglCalligraphy.onclick = toggleUseContour;
    tglNumbers.onclick = toggleNumbers;
    btnColor.onclick = showColorPicker;

    canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        removeLastStroke();
        return false;
    }, false);

    canvas.addEventListener("mousewheel", mouseScroll, false);
    canvas.addEventListener("DOMMouseScroll", mouseScroll, false);
    function mouseScroll(e) {
        var rolled = 0,
            thicknessValue = +sldThickness.value;
        if ('wheelDelta' in e) {
            rolled = e.wheelDelta;
        } else {
            rolled = e.detail;
        }

        if (rolled > 0) {
            sldThickness.valueUp();
        } else {
            sldThickness.valueDown();
        }
        e.preventDefault();
        return false;
    }
}