var JTOOLS = {};

if(document.addEventListener) {
    window.addEventListener("load", onLoad);
} else {
    window.attachEvent("onload", onLoad);
}

function onLoad() {
    var kbTriggers = document.getElementsByClassName("trigger-kb"),
        recogTriggers = document.getElementsByClassName("trigger-recog"),
        panels = [];

    JTOOLS.container = document.getElementById("container");

    addClickHandler(kbTriggers, function() {
        var kbElem = document.getElementById("kb");
        if(kbElem) {
            if(this.classList.contains("on")) {
                this.classList.remove("on");
                kbElem.style.display = "none";
            } else {
                this.classList.add("on");
                kbElem.style.display = "block";
                movePanelToTop(kbElem);
            }
        } else {
            sendRequest("keyboard.html", function(html) {
                createPanel("kb", html);
                JTOOLS.keyboard = new Keyboard();
            });
            this.classList.add("on");
        }
    });

    addClickHandler(recogTriggers, function() {
        var recogElem = document.getElementById("recog");
        if(recogElem) {
            if(this.classList.contains("on")) {
                this.classList.remove("on");
                recogElem.style.display = "none";
            } else {
                this.classList.add("on");
                recogElem.style.display = "block";
                movePanelToTop(recogElem);
            }
        } else {
            sendRequest("recognition.html", function(html) {
                createPanel("recog", html);
                JTOOLS.recognition = new Recognition();
                new Sliders();
            });
            this.classList.add("on");
        }
    });

    function addClickHandler(elems, handler) {
        if(elems instanceof HTMLCollection) {
            for(var i = 0; i < elems.length; i++) {
                elems[i].onclick = handler;
            }
        }
    }

    function createPanel(id, html) {
        var panel = document.createElement("div");
        panel.id = id;
        panel.className = "panel";
        panel.style.left = "15%";
        panel.style.top = "15%";
        panel.innerHTML = html;
        JTOOLS.container.appendChild(panel);
        setDraggable(panel);
        panels.unshift(panel);
        panel.addEventListener("mousedown", function() {
            movePanelToTop(panel);
        });
        refreshPanelsZIndices();
    }

    function movePanelToTop(panel) {
        panels.splice(panels.indexOf(panel), 1);
        panels.unshift(panel);
        refreshPanelsZIndices();
    }

    function refreshPanelsZIndices() {
        for(var i = 0; i < panels.length; i++) {
            panels[i].style.zIndex = panels.length - i;
        }
    }
}

