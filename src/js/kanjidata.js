"use strict";

function KanjiData() {
    const VERSION = "0.4",
        data = localStorage.getItem("recog"),
        version = localStorage.getItem("recog_version");

    let recog,
        loaded = false,
        loadPromise = null;

    if (data !== null && version === VERSION) {
        try {
            recog = JSON.parse(LZString.decompress(data));
            loaded = true;
        } catch (e) {
            loadPromise = downloadData();
        }
    } else {
        loadPromise = downloadData();
    }

    function downloadData() {
        return new Promise((resolve) => {
            JTOOLS.showLoader();
            sendRequest("data/recog-" + VERSION + ".json", function (data) {
                localStorage.setItem("recog", LZString.compress(data));
                localStorage.setItem("recog_version", VERSION);
                recog = JSON.parse(data);
                loaded = true;
                resolve(recog);
                JTOOLS.hideLoader();
            });
        });
    }

    async function getAllPathData() {
        if (!loaded) {
            await loadPromise;
        }
        return recog;
    }

    async function getKanjiPaths(kanji) {
        if (!loaded) {
            await loadPromise;
        }
        return recog[kanji];
    }

    return {
        getAllPathData,
        getKanjiPaths
    }
}