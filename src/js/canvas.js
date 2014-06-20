(function() {
	var	canvas = document.getElementById("paper"),
		btnRemoveLast = document.getElementById("btnRemoveLast"),
		btnRemoveAll = document.getElementById("btnRemoveAll"),
		chkGrid = document.getElementById("chkGrid"),
		chkUseContour = document.getElementById("chkUseContour"),
		chkNumbers = document.getElementById("chkNumbers"),
		sldThickness = document.getElementById("sldThickness"),
		sldBrushMass = document.getElementById("sldBrushMass"),
		
		ctx = canvas.getContext("2d"),
		canvasWidth = canvas.clientWidth,
		canvasHeight = canvas.clientHeight,
		strokeThickness = 10,
		showGrid = false,
		gridColor = "#000",
		gridSubdivideLevel = 3,
		gridContrast = 3,
		useContour = true,				// true = caligraphic brush, false = simple path
		showStrokesNumbers = false,
		brushMass = 5;
		
	canvas.onmousedown = start;	
	chkGrid.checked = showGrid;
	chkUseContour.checked = useContour;
	chkNumbers.checked = showStrokesNumbers;
	
	if(showGrid) {
		drawGrid();
	}
	
	if(sldThickness.setValue) {
		sldThickness.setValue(strokeThickness);
	} else {
		sldThickness.value = strokeThickness;
	}
	if(sldBrushMass.setValue) {
		sldBrushMass.setValue(brushMass);
	} else {
		sldBrushMass.value = brushMass;
	}
	
	/* btnRemoveLast.onclick = removeLastStroke;
	btnRemoveAll.onclick = removeAllStrokes;
	chkGrid.onclick = toggleGrid;
	chkUseContour.onclick = toggleUseContour;
	chkNumbers.onclick = toggleNumbers;
	sldThickness.onchange = changeThickness;
	sldBrushMass.onchange = changeBrushMass; */
	
	canvas.addEventListener('contextmenu', function(e) { 
			e.preventDefault(); 
			removeLastStroke(); 
			return false; 
		}, false);
		
	function mouseScroll(e) {
		var rolled = 0,
			thicknessValue = +sldThickness.value;
		if ('wheelDelta' in e) {
			rolled = e.wheelDelta;
		} else {
			rolled = -40 * e.detail;
		}

		if(rolled > 0) {
			sldThickness.valueUp();
		} else {
			sldThickness.valueDown();
		}
		e.preventDefault();
		return false;
	}
	
	if (canvas.addEventListener) {   
		canvas.addEventListener ("mousewheel", mouseScroll, false);
		canvas.addEventListener ("DOMMouseScroll", mouseScroll, false);
	} else {
		if (canvas.attachEvent) { // IE before version 9
			canvas.attachEvent ("onmousewheel", mouseScroll);
		}
	}
	
	ctx.fillCircle = function(x, y, radius, fillColor) {
		this.fillStyle = fillColor;
		this.beginPath();
		this.moveTo(x, y);
		this.arc(x, y, radius, 0, Math.PI * 2, false);
		this.fill();
	};
	
	function draw(e) {
		var pos = getMousePosition(e);
		ctx.fillCircle(pos.x, pos.y, 5, "black");
	}
	
	function start(e) {					
		draw(e);
		if(!window.savedMouseMove && document.onmousemove != draw) {
			window.savedMouseMove = document.onmousemove;
			document.onmousemove = draw;
		}
		if(!window.savedMouseUp && document.onmouseup != stop) {
			window.savedMouseUp = document.onmouseup;
			document.onmouseup = stop;
		}
		return false;
	}
	function stop(e) {
		document.onmousemove = window.savedMouseMove;
		document.onmouseup = window.savedMouseUp;
		if(window.savedMouseUp) {
			return window.savedMouseUp(e);
		}
		return false;
	}
	function getMousePosition(e) {
		var	boundX = canvas.getBoundingClientRect().left,
			boundY = canvas.getBoundingClientRect().top,
			x = e.clientX - boundX,
			y = e.clientY - boundY;
		return {x: x, y: y}; 
	}	
	function toggleGrid() {
		if(showGrid) {
			for(var i = grid.length - 1; i >= 0; i--) {
				grid.pop().remove();
			}
		} else {
			grid = drawGrid();
		}
		showGrid = !showGrid;
	}
	function drawGrid() {
		for (var i = gridSubdivideLevel; i >= 1; i--) {
			var factor = Math.pow(2, i),
				wSeg = canvasWidth / factor,
				hSeg = canvasHeight / factor,
				gridPathStr = "";
			for (var j = 1; j < factor; j++) {
				var x = Math.floor(wSeg*j) + .5, // 0.5 - to sharpen the grid
					y = Math.floor(hSeg*j) + .5;
				gridPathStr += "M" + x + " 0V" + canvasHeight + "M0 " + y + "H" + canvasWidth;
			}
			var gridPath = paper.path(gridPathStr).toBack()
					.attr({stroke: gridColor, "stroke-width": 1, "stroke-opacity": (1 / (factor * gridContrast))});
		}
	}
}());