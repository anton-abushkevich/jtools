function Recognition() {

    var VERSION = '0.2',
        kanjis = {};

    this.kanjis = kanjis;

    init();

    function init() {
        var data = localStorage.getItem("recog"),
            version = localStorage.getItem("recog_version");

        if (data !== null) {
            if (version != VERSION) {
                downloadData();
            } else {
                doInit(JSON.parse(data));
            }
        } else {
            downloadData();
        }

        function downloadData() {
            sendRequest("data/recog-" + VERSION + ".json", function (data) {
                localStorage.setItem("recog", data);
                localStorage.setItem("recog_version", VERSION);
                doInit(JSON.parse(data));
            });
        }
    }

    function doInit(recog) {
        var start = new Date;
        console.log("Parse start: " + start);
        for (var k in recog) {
            if (!recog.hasOwnProperty(k)) {
                continue;
            }

            var kanji = new Kanji(k, recog[k]),
                sub = kanjis[kanji.strokes.length];

            if (!sub) {
                sub = {};
                kanjis[kanji.strokes.length] = sub;
            }
            sub[kanji.symbol] = kanji;
        }
        console.log("Parse complete in: " + ((new Date - start) / 1000) + " sec");
    }

    function Kanji(symbol, strokesRecogData) {
        this.symbol = symbol;
        this.strokes = [];

        if (strokesRecogData) {
            parseRecogData(strokesRecogData, this.strokes);
        }

        function parseRecogData(strokesRecogData, strokes) {
            strokesRecogData = strokesRecogData.replace(/x/g, "00").replace(/y/g, "ff");
            if (strokesRecogData.length % 8 != 0) {
                //console.log("Wrong data for " + symbol + ": \"" + strokesRecogData + "\"");
                return;
            }
            var count = strokesRecogData.length / 8;
            for (var i = 0; i < count; i++) {
                var stroke = strokesRecogData.substr(i * 8, 8);
                strokes[i] = [
                    parseInt(stroke.substr(0, 2), 16),
                    parseInt(stroke.substr(2, 2), 16),
                    parseInt(stroke.substr(4, 2), 16),
                    parseInt(stroke.substr(6, 2), 16)
                ];
            }
        }
    }

    function Stroke() {

    }

}