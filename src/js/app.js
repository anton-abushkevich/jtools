"use strict";

var JTOOLS = {};

window.addEventListener("load", onLoad);
window.debug = document.getElementById("debug");

function onLoad() {
    var triggers = {
            kb: document.getElementsByClassName("trigger-kb"),
            recog: document.getElementsByClassName("trigger-recog"),
            kanjitest: document.getElementsByClassName("trigger-kanjitest")
        },
        panels = [],
        loadKbPanel = function () {
            var x = localStorage.getItem("kb.x"),
                y = localStorage.getItem("kb.y"),
                panel = JTOOLS.createPanel("kb", x ? x + "px" : "40px", y ? y + "px" : "40px");
            sendRequest("keyboard.html", function (html) {
                panel.innerHTML = html;
                JTOOLS.keyboard = new Keyboard();
                panel.style.display = "block";
            });
        },
        loadRecogPanel = function() {
            var x = localStorage.getItem("recog.x"),
                y = localStorage.getItem("recog.y"),
                panel = JTOOLS.createPanel("recog", x ? x + "px" : "396px", y ? y + "px" : "248px");
            sendRequest("recognition.html", function (html) {
                panel.innerHTML = html;
                panel.style.display = "block";
                new Sliders();
                JTOOLS.recognition = new Recognition(null, function (kanji) {
                    if (JTOOLS.keyboard) {
                        JTOOLS.keyboard.addSymbol(kanji);
                    }
                });
                JTOOLS.handwriting = new Handwriting(JTOOLS.recognition.recognize);
            });
        },
        kbX = localStorage.getItem("kb.x"),
        recogX = localStorage.getItem("recog.x");

    JTOOLS.container = document.getElementById("container");

    JTOOLS.createPanel = function(id, x, y) {
        var panel = document.createElement("div");

        // if panel hasn't loaded in 200ms, display loading message
        setTimeout(function () {
            if (!panel.innerHTML) {
                var loading = document.createElement("div");
                loading.className = "loading";
                panel.style.display = "block";
                panel.appendChild(loading);
            }
        }, 200);

        panel.style.display = "none";
        panel.id = id;
        panel.className = "panel animate-fade-in";
        panel.style.left = x ? x : "15%";
        panel.style.top = y ? y : "15%";
        JTOOLS.container.appendChild(panel);
        setDraggable(panel);
        panels.unshift(panel);
        panel.addEventListener("mousedown", function () {
            movePanelToTop(panel);
        });
        refreshPanelsZIndices();
        return panel;
    };

    JTOOLS.createPicker = function(id, x, y) {
        var picker = JTOOLS.createPanel(id, x + "px", y + "px"),
            pickerListener = picker.addEventListener("mousedown", function (e) {
                e.stopPropagation();
            }),
            listener = document.addEventListener("mousedown", removePicker);

        picker.removePicker = removePicker;
        picker.style.display = "block";

        function removePicker() {
            JTOOLS.removePanel(picker);
            document.removeEventListener("mousedown", listener);
            if(picker) {
                picker.removeEventListener("mousedown", pickerListener);
                picker = null;
            }
        }
        return picker;
    };

    JTOOLS.removePanel = function(panel) {
        if(panel) {
            JTOOLS.container.removeChild(panel);
            panels.splice(panels.indexOf(panel), 1);
            localStorage.removeItem(panel.id + ".z");
        }
    };

    if (!kbX && !recogX) {
        showPanel("kb", loadKbPanel);
        showPanel("recog", loadRecogPanel);
    } else {
        if (localStorage.getItem("kb.z")) showPanel("kb", loadKbPanel);
        if (localStorage.getItem("recog.z")) showPanel("recog", loadRecogPanel);
    }

    addClickHandler(triggers.kb, function () {
        var id = "kb",
            panel = document.getElementById(id),
            isHidden = !panel || panel.style.display === "none";
        isHidden ? showPanel(id, loadKbPanel) : hidePanel(id);
    });

    addClickHandler(triggers.recog, function () {
        var id = "recog",
            panel = document.getElementById(id),
            isHidden = !panel || panel.style.display === "none";
        isHidden ? showPanel(id, loadRecogPanel) : hidePanel(id);
    });

    function addClickHandler(elems, handler) {
        if (elems.length) {
            for (var i = 0; i < elems.length; i++) {
                elems[i].onclick = handler;
            }
        }
    }

    function showPanel(id, initFunc) {
        var panel = document.getElementById(id),
            trigs = triggers[id];
        if (panel) {
            panel.style.display = "block";
            panel.classList.remove("animate-fade-out");
            panel.classList.add("animate-fade-in");
            movePanelToTop(panel);
        } else {
            initFunc();
        }
        for (var i = 0; i < trigs.length; i++) {
            trigs[i].classList.add("on");
        }
    }

    function hidePanel(id) {
        var panel = document.getElementById(id),
            trigs = triggers[id];
        if (panel) {
            for (var i = 0; i < trigs.length; i++) {
                trigs[i].classList.remove("on");
            }
            panel.classList.remove("animate-fade-in");
            panel.classList.add("animate-fade-out");
            setTimeout(function () {
                panel.style.display = "none";
            }, 90)
        }
        localStorage.removeItem(id + ".z");
    }

    function movePanelToTop(panel) {
        panels.splice(panels.indexOf(panel), 1);
        panels.unshift(panel);
        refreshPanelsZIndices();
    }

    function refreshPanelsZIndices() {
        for (var i = 0; i < panels.length; i++) {
            panels[i].style.zIndex = panels.length - i;
            localStorage.setItem(panels[i].id + ".z", panels[i].style.zIndex);
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


