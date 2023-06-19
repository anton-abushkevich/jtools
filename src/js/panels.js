"use strict";

function Panels() {
    var panels = [],
        loaders = {},
        hasSavedPanels = false,
        container = document.getElementById("container"),
        createPanel = function (id, x, y) {
            var panel = document.createElement("div");
            panel.style.display = "none";
            panel.id = id;
            panel.className = "panel animate-fade-in";
            panel.style.left = x ? x : "15%";
            panel.style.top = y ? y : "15%";
            container.appendChild(panel);
            setDraggable(panel);
            panels.unshift(panel);
            panel.addEventListener("mousedown", function () {
                movePanelToTop(panel);
            });
            refreshPanelsZIndices();
            return panel;
        },
        removePanel = function (panel) {
            if (panel) {
                container.removeChild(panel);
                panels.splice(panels.indexOf(panel), 1);
                localStorage.removeItem(panel.id + ".z");
            }
        };

    return {
        initPanel: function (id, initFunc) {
            loaders[id] = initFunc;
            if (localStorage.getItem(id + ".z")) {
                showPanel(id, initFunc);
                hasSavedPanels = true;
            }
            addClickHandler(document.getElementsByClassName("trigger-" + id), function () {
                var panel = document.getElementById(id),
                    isHidden = !panel || panel.style.display === "none";
                isHidden ? showPanel(id, initFunc) : hidePanel(id);
            });
        },

        hasSavedPanels: function () {
            return hasSavedPanels;
        },

        loadPanel: function (id) {
            if (loaders[id]) {
                loaders[id]();
            }
        },

        createPanel: createPanel,

        removePanel: removePanel,

        createPicker: function (id, x, y) {
            var picker = createPanel(id, x + "px", y + "px"),
                stopPropagation = function (e) {
                    e.stopPropagation();
                };

            picker.addEventListener("mousedown", stopPropagation);
            document.addEventListener("mousedown", removePicker);

            picker.removePicker = removePicker;
            picker.style.display = "block";
            return picker;

            function removePicker() {
                picker.removeEventListener("mousedown", stopPropagation);
                document.removeEventListener("mousedown", removePicker);
                removePanel(picker);
                picker = null;
            }
        }
    };

    function addClickHandler(elems, handler) {
        if (elems.length) {
            for (var i = 0; i < elems.length; i++) {
                elems[i].onclick = handler;
            }
        }
    }

    function showPanel(id, initFunc) {
        var panel = document.getElementById(id),
            trigs = document.getElementsByClassName("trigger-" + id);
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
            trigs = document.getElementsByClassName("trigger-" + id);
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

