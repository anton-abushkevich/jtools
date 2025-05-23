"use strict";

function Sliders() {
    var defaultMin = 0,
        defaultMax = 20,
        defaultStep = 1,
        defaultWidth = 140,
        defaultHeight = 16,
        defaultKnobWidth = 19,
        defaultKnobHeight = 16,
        defaultKnobImage = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAQBAMAAAAG6llRAAAAAXNSR0IArs4c6QAAABVQTFRFlJSU1tbe1tbWzs7W9/f3tbW1597nN/SE2wAAADFJREFUCNdjCIWBAIYQFyhwYAhJg4IAKjMFoQDIVIICIFNZyQiElIFMYyhAYQYwwAAAVWUuIsQq8ZQAAAAASUVORK5CYII=)",
        defaultFontSize = "10px",
        defaultAngle = 0, // horizontal by default
        defaultOrigin = "50% 50%",
        defaultShowValueOnKnob = 1;

    return {
        initSlider: (id) => {
            const element = document.getElementById(id);
            const elemSlider = new _Slider(element);

            element.setValue = elemSlider.setValue;
            element.valueUp = elemSlider.valueUp;
            element.valueDown = elemSlider.valueDown;
        }
    }

    function _Slider(element) {
        var id = element.id,
            slit = document.createElement("div"),
            knob = document.createElement("div");

        element.parentElement.insertBefore(slit, element);
        slit.appendChild(knob);
        slit.className = "no-drag slit " + id + "-slit";
        knob.className = "no-drag knob " + id + "-knob";

        var style = getStyle(element),
            width = strToInt(style.width, defaultWidth),
            height = strToInt(style.height, defaultHeight),
            knobWidth = defaultKnobWidth,
            cursor = "pointer",
            fontSize = parseInt(element.fontSize),
            min = parseFloat(element.getAttribute("min")),
            max = parseFloat(element.getAttribute("max")),
            step = parseFloat(element.getAttribute("step")),
            angle = (parseInt(element.getAttribute("angle")) % 360) * Math.PI / 180,
            showValueOnKnob = parseInt(element.getAttribute("showvalue"));

        this.setValue = setValue;
        this.valueUp = valueUp;
        this.valueDown = valueDown;

        if (isNaN(min)) {
            min = defaultMin;
        }
        if (isNaN(max)) {
            max = defaultMax;
        }
        if (max < min) {
            max = min;
        }
        if (isNaN(step)) {
            step = defaultStep;
        }
        if (step > max) {
            step = max;
        }
        if (isNaN(angle)) {
            angle = defaultAngle;
        }
        if (isNaN(showValueOnKnob)) {
            showValueOnKnob = defaultShowValueOnKnob;
        }
        if (showValueOnKnob && (fontSize === 0 || isNaN(fontSize))) {
            fontSize = defaultFontSize;
        }

        var cssTransform = getSupportedProp(['transform', 'MozTransform', 'WebkitTransform', 'msTransform', 'OTransform']),
            cssTransformOrigin = getSupportedProp(['transformOrigin', 'MozTransformOrigin', 'WebkitTransformOrigin', 'msTransformOrigin', 'OTransformOrigin']);

        element.style.display = "none";

        slit.style.width = width + "px";
        slit.style.height = height + "px";
        slit.style.backgroundColor = "#f1f1f1";
        slit.style.boxShadow = "inset 0 0 0 1px #ccc";
        slit.style.display = "inline-block";
        slit.style.cursor = cursor;
        slit.title = element.title;
        changeCssProperty(slit, cssTransform, "rotate(" + angle + "rad)");
        changeCssProperty(slit, cssTransformOrigin, defaultOrigin);

        knob.style.backgroundImage = defaultKnobImage;
        knob.style.width = knobWidth + "px";
        knob.style.position = "relative";
        knob.style.lineHeight = defaultHeight + "px";
        knob.style.textAlign = "center";
        knob.style.fontSize = fontSize;

        if (element.defaultValue && element.defaultValue >= min && element.defaultValue <= max) {
            setValue(element.defaultValue);
        } else {
            setValue(min);
        }

        slit.addEventListener("mousewheel", mouseScroll, false);
        slit.addEventListener("DOMMouseScroll", mouseScroll, false);

        slit.onmousedown = start;

        function start(e) {
            move(e);
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", stop);
            return false;
        }

        function stop(e) {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", stop);
            return false;
        }

        function move(e) {
            var pos = getMousePosition(e, slit),
                value = pos * (max - min) / (width - knobWidth) + min;

            if (step > 0) {
                var rem = value % step;
                value += (rem > step / 2 ? step - rem : -rem);
            }
            setValue(value < min ? min : value > max ? max : value);
            return false;
        }

        function getMousePosition(e, elem) {
            var sin = Math.sin(angle),
                cos = Math.cos(angle),
                boundX = cos < 0 ? elem.getBoundingClientRect().right : elem.getBoundingClientRect().left,
                boundY = sin < 0 ? elem.getBoundingClientRect().bottom : elem.getBoundingClientRect().top,
                x = e.clientX - boundX - knobWidth / 2 * (cos < 0 ? -1 : 1),
                y = e.clientY - boundY - knobWidth / 2 * (sin < 0 ? -1 : 1);
            return x * cos + y * sin;
        }

        function setValue(value) {
            if (value > max) {
                value = max;
            } else if (value < min) {
                value = min;
            }

            knob.style.left = (value - min) * (width - knobWidth) / (max - min) + "px";
            element.value = value;
            knob.innerHTML = showValueOnKnob ? Math.round(value) : "&nbsp;";
            if (element.onchange) {
                element.onchange();
            }
        }

        function valueUp() {
            setValue(+element.value + (step > 0 ? step : 1));
        }

        function valueDown() {
            setValue(element.value - (step > 0 ? step : 1));
        }

        function getStyle(elem) {
            return window.getComputedStyle ? getComputedStyle(elem, null) : elem.currentStyle;
        }

        function strToInt(str, defaultValue) {
            var parsed = parseInt(str);
            return parsed ? parsed : defaultValue; // also prevents zero value
        }

        function getSupportedProp(props) {
            var root = document.documentElement;
            for (var i = 0; i < props.length; i++) {
                if (typeof root.style[props[i]] == "string") {
                    return props[i];
                }
            }
            return null;
        }

        function changeCssProperty(target, prop, value) {
            if (typeof prop != "undefined") {
                target.style[prop] = value;
            }
        }

        function mouseScroll(e) {
            var rolled = 0;
            if ('wheelDelta' in e) {
                rolled = e.wheelDelta;
            } else {
                rolled = -e.detail;
            }

            if (rolled > 0) {
                valueUp();
            } else {
                valueDown();
            }
            e.preventDefault();
            return false;
        }
    }
}