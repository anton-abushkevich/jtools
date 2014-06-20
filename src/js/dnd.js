var DRAG_TAGS_IGNORE = ["textarea", "button", "canvas", "input", "rect"];

function setDraggable(elem) {
    elem.onmousedown = startDrag;
    document.onmouseup = stopDrag;
}

function startDrag(e) {
    if(DRAG_TAGS_IGNORE.indexOf(e.target.tagName.toLowerCase()) > -1 || e.target.classList.contains("no-drag")) {
        return;
    }

    var bounds = this.getBoundingClientRect();
    this.style.margin = "0";
    this.style.top = bounds.top + "px";
    this.style.left = bounds.left + "px";

    document.nowDragged = {
        elem: this,
        initialX: e.clientX - bounds.left,
        initialY: e.clientY - bounds.top
    };
    document.onmousemove = move;
    return false;
}

function stopDrag() {
    document.mousemove = null;
    document.nowDragged = null;
}

function move(e) {
    var nowDragged = document.nowDragged;
    if(!nowDragged) {
        stopDrag();
        return;
    }

    var elem = nowDragged.elem;
    elem.style.left = (e.clientX - document.nowDragged.initialX) + "px";
    elem.style.top = (e.clientY - document.nowDragged.initialY) + "px";
}