"use strict";

function Keyboard() {

    var caps, str,
        moraMap = {
            // romaji
            "a": "あ", "i": "い", "u": "う", "e": "え", "o": "お",
            "ka": "か", "ki": "き", "ku": "く", "ke": "け", "ko": "こ",
            "sa": "さ", "si": "し", "su": "す", "se": "せ", "so": "そ", "shi": "し",
            "ta": "た", "ti": "ち", "tu": "つ", "te": "て", "to": "と", "chi": "ち", "tsu": "つ",
            "na": "な", "ni": "に", "nu": "ぬ", "ne": "ね", "no": "の",
            "ha": "は", "hi": "ひ", "hu": "ふ", "he": "へ", "ho": "ほ", "fu": "ふ",
            "ma": "ま", "mi": "み", "mu": "む", "me": "め", "mo": "も",
            "ya": "や", "yu": "ゆ", "yo": "よ",
            "ra": "ら", "ri": "り", "ru": "る", "re": "れ", "ro": "ろ",
            "wa": "わ", "wo": "を", // ん - special case, see processText()

            "ga": "が", "gi": "ぎ", "gu": "ぐ", "ge": "げ", "go": "ご",
            "za": "ざ", "ji": "じ", "zu": "ず", "ze": "ぜ", "zo": "ぞ",
            "da": "だ", "di": "ぢ", "du": "づ", "de": "で", "do": "ど",
            "ba": "ば", "bi": "び", "bu": "ぶ", "be": "べ", "bo": "ぼ",
            "pa": "ぱ", "pi": "ぴ", "pu": "ぷ", "pe": "ぺ", "po": "ぽ",

            "kya": "きゃ", "kyu": "きゅ", "kyo": "きょ",
            "gya": "ぎゃ", "gyu": "ぎゅ", "gyo": "ぎょ",
            "sya": "しゃ", "syu": "しゅ", "syo": "しょ", "sha": "しゃ", "shu": "しゅ", "sho": "しょ",
            "ja": "じゃ", "ju": "じゅ", "jo": "じょ", "jya": "じゃ", "jyu": "じゅ", "jyo": "じょ",
            "tya": "ちゃ", "tyu": "ちゅ", "tyo": "ちょ", "cha": "ちゃ", "chu": "ちゅ", "cho": "ちょ",
            "nya": "にゃ", "nyu": "にゅ", "nyo": "にょ",
            "hya": "ひゃ", "hyu": "ひゅ", "hyo": "ひょ",
            "bya": "びゃ", "byu": "びゅ", "byo": "びょ",
            "pya": "ぴゃ", "pyu": "ぴゅ", "pyo": "ぴょ",
            "mya": "みゃ", "myu": "みゅ", "myo": "みょ",
            "rya": "りゃ", "ryu": "りゅ", "ryo": "りょ",

            "kk": "っk", "gg": "っg", "ss": "っs", "zz": "っz", "tt": "っt", "dd": "っd", "hh": "っh", "ff": "っf", "bb": "っb", "pp": "っp",

            "fa": "ふぁ", "fi": "ふぃ", "fe": "ふぇ", "fo": "ふぉ",

            // киридзи
            "а": "あ", "и": "い", "у": "う", "э": "え", "о": "お", "е": "え", "й": "い",
            "ка": "か", "ки": "き", "ку": "く", "кэ": "け", "ко": "こ", "ке": "け",
            "са": "さ", "си": "し", "су": "す", "сэ": "せ", "со": "そ", "се": "せ",
            "та": "た", "ти": "ち", "цу": "つ", "тэ": "て", "то": "と", "те": "て",
            "на": "な", "ни": "に", "ну": "ぬ", "нэ": "ね", "но": "の", "не": "ね",
            "ха": "は", "хи": "ひ", "фу": "ふ", "хэ": "へ", "хо": "ほ", "хе": "へ",
            "ма": "ま", "ми": "み", "му": "む", "мэ": "め", "мо": "も", "ме": "め",
            "я": "や", "ю": "ゆ", "ё": "よ",
            "ра": "ら", "ри": "り", "ру": "る", "рэ": "れ", "ро": "ろ", "ре": "れ",
            "ва": "わ", "-ва": "は", "во": "を", "-о": "を", // ん - особый случай, см. processText()

            "га": "が", "ги": "ぎ", "гу": "ぐ", "гэ": "げ", "го": "ご", "ге": "げ",
            "дза": "ざ", "дзи": "じ", "дзу": "ず", "дзэ": "ぜ", "дзо": "ぞ", "дзе": "ぜ",
            "за": "ざ", "зи": "じ", "зу": "ず", "зэ": "ぜ", "зо": "ぞ", "зе": "ぜ",
            "да": "だ", "дэ": "で", "до": "ど", "де": "で",
            "ба": "ば", "би": "び", "бу": "ぶ", "бэ": "べ", "бо": "ぼ", "бе": "べ",
            "па": "ぱ", "пи": "ぴ", "пу": "ぷ", "пэ": "ぺ", "по": "ぽ", "пе": "ぺ",

            "кя": "きゃ", "кю": "きゅ", "кё": "きょ",
            "гя": "ぎゃ", "гю": "ぎゅ", "гё": "ぎょ",
            "ся": "しゃ", "сю": "しゅ", "сё": "しょ",
            "дзя": "じゃ", "дзю": "じゅ", "дзё": "じょ",
            "зя": "じゃ", "зю": "じゅ", "зё": "じょ",
            "тя": "ちゃ", "тю": "ちゅ", "тё": "ちょ",
            "ня": "にゃ", "ню": "にゅ", "нё": "にょ",
            "хя": "ひゃ", "хю": "ひゅ", "хё": "ひょ",
            "бя": "びゃ", "бю": "びゅ", "бё": "びょ",
            "пя": "ぴゃ", "пю": "ぴゅ", "пё": "ぴょ",
            "мя": "みゃ", "мю": "みゅ", "мё": "みょ",
            "ря": "りゃ", "рю": "りゅ", "рё": "りょ",

            ":": "う", // удлиннение

            "кк": "っк", "гг": "っг", "сс": "っс", "тт": "っт", "цц": "っц", "дд": "っд", "хх": "っх", "фф": "っф", "бб": "っб", "пп": "っп",

            "фа": "ふぁ", "фи": "ふぃ", "фэ": "ふぇ", "фо": "ふぉ", "фе": "ふぇ",

            "--": "ー", "_": "ー", "~": "～",
            " ": "　", ",": "、", ".": "。", "!": "！", "?": "？", "%": "％", "[": "【", "]": "】", "/" : "／",

            "0": "０", "1": "１", "2": "２", "3": "３", "4": "４", "5": "５", "6": "６", "7": "７", "8": "８", "9": "９"
        };

    this.addSymbol = addSymbol;

    document.getElementById("outHiragana").onclick = chooseHiraganaOutput;
    document.getElementById("outKatakana").onclick = chooseKatakanaOutput;
    document.getElementById("hiragana").onclick = switchKeyboard;
    document.getElementById("katakana").onclick = switchKeyboard;
    document.getElementById("romaji").onclick = switchKeyboard;
    document.getElementById("kiriji").onclick = switchKeyboard;
    document.getElementById("space").onclick = space;
    document.getElementById("backspace").onclick = backspace;
    document.getElementById("clear").onclick = clearText;

    str = document.getElementById('str');
    str.oninput = processText;
    var strHeight = localStorage.getItem("kb.out.height");
    if(strHeight && !(navigator.userAgent.lastIndexOf('Chrome/') > 0)) {   // http://code.google.com/p/chromium/issues/detail?id=94583
        str.style.height = strHeight;
    }
    str.addEventListener("mousedown", function() {
        strHeight = str.style.height;
    });
    document.addEventListener("mouseup", function() {
        if(str.style.height !== strHeight) {
            localStorage.setItem("kb.out.height", str.style.height);
        }
    });
    str.focus();

    var storedOut = localStorage.getItem("kb.out"),
        storedLayout = localStorage.getItem("kb.layout");

    // set layout and output: hiragana is default for both
    document.getElementById(storedLayout ? storedLayout : "hiragana").onclick();
    document.getElementById(storedOut ? storedOut : "outHiragana").onclick();

    rikaichanSupport();

    function chooseHiraganaOutput() {
        caps = false;
        document.getElementById("outHiragana").className = "output selected";
        document.getElementById("outKatakana").className = "output";
        convertSelectedString("katakana", "hiragana");
        str.focus();
        localStorage.setItem("kb.out", "outHiragana");
    }

    function chooseKatakanaOutput() {
        caps = true;
        document.getElementById("outKatakana").className = "output selected";
        document.getElementById("outHiragana").className = "output";
        convertSelectedString("hiragana", "katakana");
        str.focus();
        localStorage.setItem("kb.out", "outKatakana");
    }

    function convertSelectedString(from, to) {
        var s = str.selectionStart,
            e = str.selectionEnd,
            value = str.value;
        if (s !== undefined && s !== value.length) {
            var strBefore = value.substring(0, s),
                strAfter = value.substring(e, value.length),
                strToChange = convertString(value.substring(s, e), from, to);
            str.value = strBefore + strToChange + strAfter;
            str.selectionStart = s;
            str.selectionEnd = e;
        }
    }

    function convertString(str, from, to) {
        var changedStr = "";
        for (var i = 0; i < str.length; i++) {
            var symbFrom = str.charAt(i),
                elem = querySelectorWrapper("button[" + from + "=" + symbFrom + "].symb");
            changedStr += elem ? elem.getAttribute(to) : symbFrom;
        }
        return changedStr;

        function querySelectorWrapper(query) {
            var elem;
            try {
                elem = document.querySelector(query);
            } catch (err) {
                // do nothing. selector is invalid. elem will remain undefined
            }
            return elem;
        }
    }

    function switchKeyboard() {
        var symbs = document.getElementsByClassName("symb"),
            len = symbs.length,
            selectedButton = document.getElementsByClassName("aux selected");

        if (selectedButton[0]) {
            if (selectedButton[0] === this) return; 	// nothing to change, if already active button clicked
            selectedButton[0].className = "aux";
        }

        if (this.id === "katakana") {
            chooseKatakanaOutput();
        } else {
            chooseHiraganaOutput();
        }

        this.className = "aux selected";
        for (var i = 0; i < len; i++) {
            if (!symbs[i].onclick) {
                symbs[i].onclick = addSymbolClick;
            }
            symbs[i].innerHTML = symbs[i].getAttribute(this.id) || symbs[i].getAttribute("default");
        }
        localStorage.setItem("kb.layout", this.id);
    }

    function getSymbol(element, attr) {
        return element.getAttribute(attr) || element.getAttribute("default");
    }

    function addSymbolClick(e) {
        addSymbol(e.shiftKey === caps ? getSymbol(this, "hiragana") : getSymbol(this, "katakana"));
    }

    function addSymbol(symb) {
        if (!symb) return;

        var s = str.selectionStart,
            e = str.selectionEnd;
        if (s !== undefined) {
            if (s === str.value.length) {
                str.value += symb;
            } else {
                str.value = str.value.slice(0, s) + symb + str.value.slice(e);
            }
            str.selectionEnd = str.selectionStart = s + symb.length;
        } else {
            str.value += symb;
        }
        str.focus();
    }

    function space() {
        addSymbol('　');
    }

    function backspace() {
        var s = str.selectionStart,
            e = str.selectionEnd;
        if (s !== undefined) {
            if (s === e) {
                if (s > 0) {
                    str.value = str.value.slice(0, s - 1) + str.value.slice(e);
                    str.selectionEnd = str.selectionStart = s - 1;
                }
            } else {
                str.value = str.value.slice(0, s) + str.value.slice(e);
                str.selectionEnd = str.selectionStart = s;
            }
        } else {
            str.value = str.value.slice(0, -1);
        }
        str.focus();
    }

    function clearText() {
        str.value = "";
        str.focus();
    }

    function processText() {
        var s = str.selectionStart,
            letter1 = str.value.charAt(s - 3) && str.value.charAt(s - 3).toLowerCase(),
            letter2 = str.value.charAt(s - 2) && str.value.charAt(s - 2).toLowerCase(),
            letter3 = str.value.charAt(s - 1) && str.value.charAt(s - 1).toLowerCase(),
            mora3 = moraMap[letter1 + letter2 + letter3],
            mora2 = moraMap[letter2 + letter3],
            mora1 = moraMap[letter3],
            mora, symbQ;

        if (mora3) {
            mora = mora3;
            symbQ = 3;
        } else if (mora2) {
            mora = mora2;
            symbQ = 2;
        } else if (mora1) {
            mora = mora1;
            symbQ = 1;

            if (letter2.toLowerCase() === "n" || letter2.toLowerCase() === "н") {
                processN(); // process ん in case of one-symbol conversion: space, comma, dot
            }

        } else if ((letter2.toLowerCase() === "n" && letter3.toLowerCase() !== "y") || letter2.toLowerCase() === "н" ) {
            processN(); // process ん in case of two-symbol conversion,
                        // except following "y" for three-letter conversion of 「にゃ」、「にゅ」 and「にょ」
        }

        if (mora) {
            if ((str.value.charAt(s - 1) !== letter3) !== caps) {
                mora = convertString(mora, "hiragana", "katakana");
            }
            if (s <= symbQ) {
                str.value = mora + str.value.slice(s);
                str.selectionStart = str.selectionEnd = mora.length;
            } else {
                str.value = str.value.slice(0, s - symbQ) + mora + str.value.slice(s);
                str.selectionStart = str.selectionEnd = s - symbQ + mora.length;
            }
            //console.log(mora + ": " + mora.charCodeAt(0));
        }

        function processN() {
            var moraN = "ん";
            if ((str.value.charAt(s - 2) !== letter2) !== caps) {
                moraN = "ン";
            }
            str.value = str.value.slice(0, s - 2) + moraN + str.value.slice(s - 1);
            str.selectionStart = str.selectionEnd = s;
        }
    }

    /** various behavior definitions concerning Rikaichan (Firefox) and Rikaikun (Chrome) addons
     */
    function rikaichanSupport() {
        // selected kanji and its index. see mouse scroll event handler
        var kanji,
            index;

        // on click rikaichan-window removes before the "click" event, so we use "mousedown"
        document.addEventListener("mousedown", function (e) {
            var rikaichan = document.getElementById("rikaichan-window");

            if (!rikaichan) {
                rikaichan = document.getElementById("rikaichamp-window");
            }

            if (rikaichan && rikaichan.innerHTML && (e.button === 0 || e.button === 1) && kanji) {
                e.preventDefault();
                addSymbol(e.button ? kanjiOnly(kanji) : kanji);
                clear();
                return false;
            }
        });

        // mousewheel - select a kanji to paste
        document.addEventListener("DOMMouseScroll", onmousewheel, false);
        document.addEventListener("mousewheel", onmousewheel, false);

        document.addEventListener("DOMNodeInserted", function (e) {
            if (kanji && (e.relatedNode.id === "rikaichan-window" || e.relatedNode.id === "rikaichamp-window")) {
                clear();
            }
        });

        document.addEventListener("DOMNodeRemoved", function (e) {
            if (e.relatedNode.id === "rikaichan-window" || e.relatedNode.id === "rikaichamp-window") {
                document.getElementById("str").focus();
            }
        });

        function onmousewheel(e) {
            var kanjis = document.getElementsByClassName("w-kanji");

            if (kanjis.length > 0) {
                e.preventDefault();
                if (kanji === undefined) {
                    index = 0;
                    selectKanji();
                    kanji = kanjis[0].innerHTML;
                } else {
                    index += (('wheelDelta' in e) ? e.wheelDelta : -e.detail) < 0 ? 1 : -1;
                    if (index >= kanjis.length) {
                        index = 0;
                    }
                    if (index < 0) {
                        index = kanjis.length - 1;
                    }
                    selectKanji();
                    kanji = kanjis[index].innerHTML;
                }
            }

            return false;

            function selectKanji() {
                for (var i = 0; i < kanjis.length; i++) {
                    kanjis[i].className = "w-kanji" + (i === index ? " selected" : "");
                }
            }
        }

        function clear() {
            kanji = undefined;
            index = 0;
        }

        function kanjiOnly(kanji) {
            var curr, i;
            for(i = kanji.length - 1; i >= 0; i--) {
                curr = kanji.charCodeAt(i);
                if(curr < 12353 || curr > 12540) {    // not kana
                    break;
                }
            }
            return kanji.substr(0, i + 1);
        }
    }
}