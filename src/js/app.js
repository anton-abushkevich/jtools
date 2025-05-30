"use strict";

var JTOOLS = {};

window.addEventListener("load", onLoad);
window.debug = document.getElementById("debug");

function onLoad() {
    var panels = new Panels(),
        numberLoading = 0;


    JTOOLS.showLoader = function () {
        numberLoading++;
        document.getElementById("footer").classList.add("loading");
    };

    JTOOLS.hideLoader = function () {
        numberLoading--;
        if (numberLoading === 0) {
            document.getElementById("footer").classList.remove("loading");
        }
    };

    JTOOLS.kanjiData = new KanjiData();
    JTOOLS.createPicker = panels.createPicker;
    JTOOLS.sliders = new Sliders();
    JTOOLS.utils = new Utils();

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
            JTOOLS.sliders.initSlider("sldThickness");
            JTOOLS.sliders.initSlider("sldBrushMass");
            JTOOLS.recognition = new Recognition(null,
                function (kanji) {
                    if (JTOOLS.keyboard) {
                        JTOOLS.keyboard.addSymbol(kanji);
                    }
                },
                function (kanji) {
                    if (JTOOLS.kakijun) {
                        JTOOLS.kakijun.setSymbol(kanji);
                    }
                });
            JTOOLS.handwriting = new Handwriting(JTOOLS.recognition.recognize);
            JTOOLS.hideLoader();
        });
    });

    panels.initPanel("kakijun", function() {
        JTOOLS.showLoader();
        sendRequest("kakijun.html", function (html) {
            var x = localStorage.getItem("kakijun.x"),
                y = localStorage.getItem("kakijun.y"),
                panel = panels.createPanel("kakijun", x ? x + "px" : "426px", y ? y + "px" : "258px");

            panel.innerHTML = html;
            panel.style.display = "block";
            JTOOLS.sliders.initSlider("kakijunProgress");
            JTOOLS.kakijun = new Kakijun();
            JTOOLS.hideLoader();
        });
    });

    if (!panels.hasSavedPanels()) {
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


