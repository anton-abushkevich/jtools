"use strict";

var DRAG_TAGS_IGNORE = ["textarea", "button", "canvas", "input", "rect"];

function setDraggable(elem) {
	var initialX, initialY;
	
    elem.addEventListener("mousedown", startDrag);

	function startDrag(e) {
		if (e.which != 1 ||
			DRAG_TAGS_IGNORE.indexOf(e.target.tagName.toLowerCase()) > -1 ||
			e.target.classList.contains("no-drag")) {
			return;
		}

		initialX = e.clientX - elem.getBoundingClientRect().left;
		initialY = e.clientY - elem.getBoundingClientRect().top;
	
		document.addEventListener("mousemove", move);
		document.addEventListener("mouseup", stopDrag);

		document.body.classList.add("unselectable"); // prevent text selection on drag
	}

	function stopDrag() {
		localStorage.setItem(elem.id + ".x", elem.getBoundingClientRect().left);
		localStorage.setItem(elem.id + ".y", elem.getBoundingClientRect().top);		
		document.removeEventListener("mousemove", move);
		document.removeEventListener("mouseup", stopDrag);
		document.body.classList.remove("unselectable");
	}

	function move(e) {
		elem.style.left = (e.clientX - initialX) + "px";
		elem.style.top = (e.clientY - initialY) + "px";
	}
}