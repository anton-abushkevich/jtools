(function() {

window.sendRequest = function(url, callback, postData) {
    var req = createXMLHTTPObject();
    if (!req) return;
	
    var method = (postData) ? "POST" : "GET";
    req.open(method, url, true);
	
    if (postData) {
        req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
	}	
    req.onreadystatechange = function () {
        if (req.readyState != 4) return;
        if (req.status != 200 && req.status != 304) {
			alert('HTTP error. Something went wrong in server side.');
            return;
        }
        callback(req.responseText);
    }
    if (req.readyState == 4) return;
    req.send(postData);
}

var XMLHttpFactories = [
    function () {return new XMLHttpRequest()},
    function () {return new ActiveXObject("Msxml2.XMLHTTP")},
    function () {return new ActiveXObject("Msxml3.XMLHTTP")},
    function () {return new ActiveXObject("Microsoft.XMLHTTP")}
];

function createXMLHTTPObject() {
    var xmlhttp = false;
    for (var i = 0; i < XMLHttpFactories.length; i++) {
        try {
            xmlhttp = XMLHttpFactories[i]();
        } catch (e) {
            continue;
        }
        break;
    }
    return xmlhttp;
}

}());