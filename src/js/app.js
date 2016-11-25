"use strict";

var JTOOLS = {};

window.addEventListener("load", onLoad);
window.debug = document.getElementById("debug");

function onLoad() {
    var panels = new Panels();

    JTOOLS.showLoader = function () {
        document.getElementById("footer").classList.add("loading");
    };

    JTOOLS.hideLoader = function () {
        document.getElementById("footer").classList.remove("loading");
    };

    JTOOLS.createPicker = panels.createPicker;

    panels.initPanel("kb", function () {
        JTOOLS.showLoader();
        sendRequest("keyboard.html", function (html) {
            var x = localStorage.getItem("kb.x"),
                y = localStorage.getItem("kb.y"),
                panel = panels.createPanel("kb", x ? x + "px" : "40px", y ? y + "px" : "40px");
            panel.innerHTML = html;
            JTOOLS.keyboard = new Keyboard();
            panel.style.display = "block";
            JTOOLS.hideLoader();
        });
    });

    panels.initPanel("recog", function() {
        JTOOLS.showLoader();
        sendRequest("recognition.html", function (html) {
            var x = localStorage.getItem("recog.x"),
                y = localStorage.getItem("recog.y"),
                panel = panels.createPanel("recog", x ? x + "px" : "396px", y ? y + "px" : "248px");

            panel.innerHTML = html;
            panel.style.display = "block";
            new Sliders();
            JTOOLS.recognition = new Recognition(null, function (kanji) {
                if (JTOOLS.keyboard) {
                    JTOOLS.keyboard.addSymbol(kanji);
                }
            });
            JTOOLS.handwriting = new Handwriting(JTOOLS.recognition.recognize);
            JTOOLS.hideLoader();
        });
    });

    panels.initPanel("kanjitest", function() {
        JTOOLS.showLoader();
        sendRequest("kanjitest.html", function (html) {
            var x = localStorage.getItem("kanjitest.x"),
                y = localStorage.getItem("kanjitest.y"),
                panel = panels.createPanel("kanjitest", x ? x + "px" : "426px", y ? y + "px" : "258px");

            panel.innerHTML = html;
            panel.style.display = "block";
            //JTOOLS.kanjitest = new KanjiTest();
            JTOOLS.hideLoader();
        });
    });

    if (!panels.hasSavedPanes()) {
        panels.loadPanel("kb");
        panels.loadPanel("recog");
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


