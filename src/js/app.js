var JTOOLS = {};

window.addEventListener("load", onLoad);
window.debug = document.getElementById("debug");

function onLoad() {
    var triggers = {
            kb: document.getElementsByClassName("trigger-kb"),
            recog: document.getElementsByClassName("trigger-recog")
        },
        panels = [],
        loadKbPanel = function () {
            sendRequest("keyboard.html", function (html) {
                var x = localStorage.getItem("kb.x"),
                    y = localStorage.getItem("kb.y");
                JTOOLS.createPanel("kb", html, x ? x + "px" : "10%", y ? y + "px" : "10%");
                JTOOLS.keyboard = new Keyboard();
            });
        },
        loadRecogPanel = function() {
            sendRequest("recognition.html", function (html) {
                var x = localStorage.getItem("recog.x"),
                    y = localStorage.getItem("recog.y");
                JTOOLS.createPanel("recog", html, x ? x + "px" : "20%", y ? y + "px" : "20%");
                new Sliders();
                JTOOLS.recognition = new Recognition();
                JTOOLS.handwriting = new Handwriting(function (data) {
                    var match = JTOOLS.recognition.recognize(data);
                    debug.innerHTML = match.symbol + " (" + match.score + ")";
                });
            });
        },
        kbZIndex = localStorage.getItem("kb.z"),
        recogZIndex = localStorage.getItem("recog.z");

    JTOOLS.container = document.getElementById("container");

    if(kbZIndex) showPanel("kb", loadKbPanel);
    if(recogZIndex) showPanel("recog", loadRecogPanel);

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
        if (elems instanceof HTMLCollection) {
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
            panel.style.display = "none";
        }
        localStorage.removeItem(id + ".z");
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
    };

    JTOOLS.createPicker = function(id, html, x, y) {
        var picker = JTOOLS.createPanel(id, html, x + "px", y + "px"),
            pickerListener = picker.addEventListener("mousedown", function (e) {
                e.stopPropagation();
            }),
            listener = document.addEventListener("mousedown", removePicker);

        picker.removePicker = removePicker;

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

