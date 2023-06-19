"use strict";

function Utils() {
    const drawGrid = (paper, canvasWidth, canvasHeight, gridSubdivideLevel, gridColor, gridContrast) => {
        const _gridSubdivideLevel = gridSubdivideLevel || 3,
            _gridColor = gridColor || "#000",
            _gridContrast = gridContrast || 3,
            gridLines = [];
        for (let i = _gridSubdivideLevel; i >= 1; i--) {
            const factor = Math.pow(2, i),
                wSeg = canvasWidth / factor,
                hSeg = canvasHeight / factor;
            let gridPathStr = "";
            for (let j = 1; j < factor; j++) {
                const x = Math.floor(wSeg * j) + .5, // 0.5 - to sharpen the grid
                    y = Math.floor(hSeg * j) + .5;
                gridPathStr += "M" + x + " 0V" + canvasHeight + "M0 " + y + "H" + canvasWidth;
            }
            const gridPath = svgElem(paper, "path", true).attrs({d: gridPathStr,
                fill: "none", stroke: _gridColor, "stroke-width": 1,
                "stroke-opacity": (1 / (factor * _gridContrast))});
            gridLines.push(gridPath);
        }
        return gridLines;
    };

    const svgElem = (parent, name, prepend) => {
        let elem = document.createElementNS("http://www.w3.org/2000/svg", name);
        prepend ? parent.insertBefore(elem, parent.firstChild) : parent.appendChild(elem);

        elem.attrs = function (attributes) {
            for (let key in attributes) {
                if (attributes.hasOwnProperty(key)) {
                    elem.setAttribute(key, attributes[key]);
                }
            }
            return elem;
        };
        elem.child = function (name, content) {
            const child = document.createElementNS("http://www.w3.org/2000/svg", name);
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
    }

    return {
        drawGrid: drawGrid,
        svgElem: svgElem,
    };
}