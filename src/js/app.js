var JTOOLS = {};

window.addEventListener("load", onLoad);

function onLoad() {
    var kbTriggers = document.getElementsByClassName("trigger-kb"),
        recogTriggers = document.getElementsByClassName("trigger-recog"),
        panels = [];

    JTOOLS.container = document.getElementById("container");

    addClickHandler(kbTriggers, function () {
        var kbElem = document.getElementById("kb");
        if (kbElem) {
            if (this.classList.contains("on")) {
                this.classList.remove("on");
                kbElem.style.display = "none";
            } else {
                this.classList.add("on");
                kbElem.style.display = "block";
                movePanelToTop(kbElem);
            }
        } else {
            sendRequest("keyboard.html", function (html) {
                JTOOLS.createPanel("kb", html);
                JTOOLS.keyboard = new Keyboard();
            });
            this.classList.add("on");
        }
    });

    addClickHandler(recogTriggers, function () {
        var recogElem = document.getElementById("recog");
        if (recogElem) {
            if (this.classList.contains("on")) {
                this.classList.remove("on");
                recogElem.style.display = "none";
            } else {
                this.classList.add("on");
                recogElem.style.display = "block";
                movePanelToTop(recogElem);
            }
        } else {
            sendRequest("recognition.html", function (html) {
                JTOOLS.createPanel("recog", html);
                new Sliders();
                JTOOLS.recognition = new Recognition();
                JTOOLS.handwriting = new Handwriting();
            });
            this.classList.add("on");
        }
    });

    function addClickHandler(elems, handler) {
        if (elems instanceof HTMLCollection) {
            for (var i = 0; i < elems.length; i++) {
                elems[i].onclick = handler;
            }
        }
    }

    JTOOLS.createPanel = function(id, html, x, y) {
        var panel = document.createElement("div");
        panel.id = id;
        panel.className = "panel";
        panel.style.left = x ? x : "15%";
        panel.style.top = y ? y : "15%";
        panel.innerHTML = html;
        JTOOLS.container.appendChild(panel);
        setDraggable(panel);
        panels.unshift(panel);
        panel.addEventListener("mousedown", function () {
            movePanelToTop(panel);
        });
        refreshPanelsZIndices();
        return panel;
    }

    JTOOLS.removePanel = function(panel) {
        JTOOLS.container.removeChild(panel);
        panels.splice(panels.indexOf(panel), 1);
    }

    function movePanelToTop(panel) {
        panels.splice(panels.indexOf(panel), 1);
        panels.unshift(panel);
        refreshPanelsZIndices();
    }

    function refreshPanelsZIndices() {
        for (var i = 0; i < panels.length; i++) {
            panels[i].style.zIndex = panels.length - i;
        }
    }
}

/** text - message text,
 *  type - message type ("error", "info", "success")
 */
function message(text, type) {
    var mDiv = document.getElementById("message");

    if (!mDiv) {
        mDiv = document.createElement("div");
        mDiv.setAttribute("id", "message");
        document.body.insertBefore(mDiv, null);
    }

    if (!type) {
        type = "info";
    }

    mDiv.innerHTML = "<div class=\"" + type + "\">" + text + "</div>";
    mDiv.style.display = "block";
    mDiv.onclick = function () {
        mDiv.style.display = "none";
    }
}

