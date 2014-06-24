function ColorPicker() {

    this.showAtElement = function (elem, callback) {
        var bounds = elem.getBoundingClientRect();
        return showAt(bounds.left, elem.offsetHeight + bounds.top, callback);
    }

    function showAt(x, y, callback) {
        var panel = JTOOLS.createPanel("colorpicker", "", x + "px", y + "px"),
            pickerListener = panel.addEventListener("mousedown", function (e) {
                e.stopPropagation();
            }),
            listener = document.addEventListener("mousedown", removePicker),
            h, l, colorBtn;

        for (h = 0; h <= 100; h += 5) {
            createButton(h/100, 1, 0.75);
        }
        panel.appendChild(document.createElement("br"));
        for (h = 0; h <= 100; h += 5) {
            createButton(h/100, 1, 0.5);
        }
        panel.appendChild(document.createElement("br"));
        for (h = 0; h <= 100; h += 5) {
            createButton(h/100, 1, 0.25);
        }
        panel.appendChild(document.createElement("br"));
        for (l = 0; l <= 100; l += 5) {
            createButton(0, 0, l/100);
        }
        panel.appendChild(document.createElement("br"));
        var randomColorButton = document.createElement("button");
        randomColorButton.className = "randomColor";
        randomColorButton.innerHTML = "Random color";
        randomColorButton.onclick = function() {
            removePicker();
            callback("random");
        }
        panel.appendChild(randomColorButton);

        return panel;

        function createButton(h, s, l) {
            var rgb = hslToRgb(h, s, l),
                colorStr = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
            colorBtn = document.createElement("button");
            colorBtn.className = "color";
            colorBtn.style.backgroundColor = colorStr;
            colorBtn.onclick = function () {
                removePicker();
                callback(colorStr);
            }
            panel.appendChild(colorBtn);
        }

        function removePicker() {
            JTOOLS.removePanel(panel);
            document.removeEventListener("mousedown", listener);
            panel.removeEventListener("mousedown", pickerListener);
            panel = null;
        }

        function hslToRgb(h, s, l) {
            var r, g, b;

            if (s == 0) {
                r = g = b = l;
            } else {
                function hue2rgb(p, q, t) {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                }

                var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                var p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }

            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }
    }
}
