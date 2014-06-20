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
        for (var k in recog) {
            var kanji = new Kanji(k, recog[k]);

            var sub = kanjis[kanji.strokes.length];
            if (!sub) {
                sub = {};
                kanjis[kanji.strokes.length] = sub;
            }
            sub[kanji.symbol] = kanji;
        }
    }

    function Kanji(symbol, strokesRecogData) {
        this.symbol = symbol;
        this.strokes = [];

        if (strokesRecogData) {
            parseRecogData(strokesRecogData, this.strokes);
        }

        function parseRecogData(strokesRecogData, strokes) {
            var rnd = Math.floor(Math.random() * 10 + 1);
            for (var i = 0; i < rnd; i++) {
                strokes[i] = i + rnd;
            }
        }
    }

    function Stroke() {

    }

}