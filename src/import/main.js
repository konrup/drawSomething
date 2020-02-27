/// </// <reference path="pixel.js" />
((window) => {
    // Setup
    var h = Math.floor(window.innerHeight / 2 - 70);
    var w = Math.floor(h * 1.33);
    var socket = setupSocket('ws://localhost:8090');

    var cnvs_pic = setUpMainCanvas();

    // UnDo
    var lines = [];
    var lastPush = Date.now();

    // Sharing canvas
    var buffer = [];
    var lastShare = Date.now();

    // Overlay
    var cnvs_overlay = new pixel.Art(w, h, true);
    document.getElementById("content").appendChild(cnvs_overlay.setupVideoOverlay(draw));
    cnvs_overlay.isTrackedColor = pixel.isRed;

    // Animationloop
    function draw() {
        cnvs_overlay.drawImageByVideo();
        cnvs_overlay.manipulateImageData(trackRedColor);
        requestAnimationFrame(draw);
    }

    // Filters for colortracking and drawing
    function trackRedColor(data) {
        var av_x = 0;
        var av_y = 0;
        var count = 0;

        var i;
        for (var x = 0; x < w; x++) {
            for (var y = 0; y < h; y++) {
                i = ((w * y) + x) << 2;
                data[i + 3] = 0;

                if (x % 2 == 0 && y % 2 == 0) {
                    if (pixel.sim([data[i], data[i + 1], data[i + 2]], trackedColor) > 0.5) {
                        av_x += x / w; av_y += y / h; count++;
                        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 255;
                    }
                } else if (x % 2 > 0 && y % 2 == 0) {
                    if (pixel.sim([data[i], data[i + 1], data[i + 2]], trackedColor) > 0.3) {
                        var hsv1 = pixel.Hsv(data[i], data[i + 1], data[i + 2]);
                        if (Math.abs((hsv1 + 10) % 360 - (trackedColorHSV[0] + 10) % 360) < 10) {
                            av_x += x / w; av_y += y / h; count++;
                            data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 255;
                        }
                    }
                } else if (x % 2 == 0 && y % 2 > 0) {
                    if (data[i] + data[i + 1] + data[i + 2] > 150 &&
                        pixel.towards([data[i], data[i + 1], data[i + 2]], trackedColor, 0.15)) {
                        av_x += x / w; av_y += y / h; count++;
                        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 255;
                    }
                } else {
                    if (pixel.sim([data[i], data[i + 1], data[i + 2]], trackedColor) > 0.3) {
                        if (cnvs_overlay.isTrackedColor(data[i], data[i + 1], data[i + 2])) {
                            av_x += x / w; av_y += y / h; count++;
                            data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 255;
                        }
                    }
                }
            }
        }
        var x = 1 - av_x / count;
        var y = av_y / count;
        var p = count / w / h;
        drawOnCanvas(x, y, p);
        if (window.share) shareBuffer(x, y, p);
    }

    // public
    window.slider_shadow_changed = function (val) {
        pixel.shadow = val;
        document.getElementById("cell_shadowvalue").innerHTML = val;
    }

    window.slider_light_changed = function (val) {
        pixel.light = val;
        document.getElementById("cell_lightvalue").innerHTML = val;
    }

    window.slider_color_changed = function (hex) {
        var r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);
        trackedColorHSV = pixel.HSV(r, g, b);
        var val = trackedColorHSV[0];
        var colorname = "Red";
        if (val < 30 || val == 360) {
            colorname = "Red";
        } else if (val < 60) {
            colorname = "Orange"
        } else if (val < 90) {
            colorname = "Yellow";
        } else if (val < 120) {
            colorname = "YellowGreen";
        } else if (val < 150) {
            colorname = "Green";
        } else if (val < 180) {
            colorname = "SpringGreen";
        } else if (val < 210) {
            colorname = "Cyan";
        } else if (val < 240) {
            colorname = "DeepSkyBlue";
        } else if (val < 270) {
            colorname = "Blue";
        } else if (val < 300) {
            colorname = "SlateBlue";
        } else if (val < 330) {
            colorname = "Magenta";
        } else if (val < 360) {
            colorname = "DeepPink";
        } else {
            colorname = "Red";
        }
        trackedColor = [r, g, b];
        cnvs_overlay.isTrackedColor = window.pixel["is" + colorname];
        cnvs_pic.context.shadowColor = hex;
        cnvs_pic.context.strokeStyle = hex;
        document.getElementById("cell_color").innerHTML = colorname;
    }

    window.onbeforeunload = function () {
        document.getElementById("slider_light").value = 1;
        document.getElementById("slider_shadow").value = 1;
        document.getElementById("slider_color").value = "#ff0000";
        document.getElementById("cell_lightvalue").innerHTML = 1;
        document.getElementById("cell_shadowvalue").innerHTML = 1;
    }

    window.onload = window.onbeforeunload;

    // private    
    var trackedColor = [255, 0, 0];
    var trackedColorHSV = [0, 1, 1];

    cnvs_overlay.canvas.onclick = function () {
        cnvs_pic.context.beginPath();
        cnvs_pic.context.clearRect(w, 0, 0 - w, h);

        // Sharing canvas
        if (window.share && socket && socket.myID) {
            socket.send(`{"method":"broadcast","params":[256,${socket.myID}]}`);
        }
    }

    cnvs_pic.canvas.onclick = function () {
        if (lines.length > 0)
            cnvs_pic.setImage(lines.pop());
    }

    // Helper
    function setUpMainCanvas() {
        var cnvs_pic = new pixel.Art(w, h, true);
        cnvs_pic.appendTo(document.getElementById("content"));
        cnvs_pic.context.lineWidth = 2;
        cnvs_pic.context.strokeStyle = "red";
        cnvs_pic.context.shadowColor = "red";
        cnvs_pic.context.shadowBlur = 3;
        cnvs_pic.context.shadowOffsetX = 2;
        cnvs_pic.context.shadowOffsetY = 2;
        return cnvs_pic;
    }

    function drawOnCanvas(x, y, p) {
        if (p < 0.001) {
            cnvs_pic.context.moveTo(x * w, y * h);
            cnvs_pic.context.beginPath();
        } else {
            cnvs_pic.context.lineWidth = p > 0.10 ? 10 / h : p * h;
            cnvs_pic.context.lineTo(x * w, y * h);
            cnvs_pic.context.stroke();
            // UnDo
            if (lastPush + 500 < Date.now()) {
                if (lines.length > 100) lines.shift();
                lines.push(cnvs_pic.getImage());
                lastPush = Date.now();
            }
        }
    }

    function shareBuffer(x, y, pressure) {
        if (!pressure && buffer.length == 0) return;
        if (x) buffer.push(x.toFixed(4));
        if (y) buffer.push(y.toFixed(4));
        if (pressure) buffer.push(pressure.toFixed(4));

        var drawNow = lastShare + 2000 < Date.now();
        if (window.realtime) drawNow = true;
        if (socket && socket.myID && drawNow) {
            socket.send(`{"method":"broadcast","params":[128,${socket.myID},[${buffer}]]}`);
            buffer = [];
            lastShare = Date.now();
        }
    }

    function setupSocket(url) {
        try {
            var ws = new WebSocket(url);
            ws.myID = null;

            ws.onopen = () => {
                var request = '{"id":1,"method":"setup","params":[]}';
                ws.send(request);
            };

            ws.onmessage = (msg) => {
                try {
                    var data = JSON.parse(msg.data);

                    if (data.error) throw data.error;

                    if (data.method) {
                        switch (data.method) {
                            case "broadcast":
                                if (data.params[0] == 128 && data.params[1] == window.listen && window.listen != socket.myID) {

                                    // Draw on Canvas
                                    var arr = data.params[2];
                                    for (var i = 0; i < arr.length; i += 3) {

                                        ((x, y, p, i) => {
                                            setTimeout(() => {
                                                drawOnCanvas(x, y, p);
                                            }, i);
                                        })(arr[i], arr[i + 1], arr[i + 2], i);
                                    }

                                } else if (data.params[0] == 256 && data.params[1] == window.listen && window.listen != socket.myID) {

                                    // Delete Canvas
                                    cnvs_pic.context.beginPath();
                                    cnvs_pic.context.clearRect(w, 0, 0 - w, h);

                                } else {
                                    console.log("(<- " + msg.data);
                                }
                                break;
                            default:
                                throw "method not found";
                        }
                    } else if (!isNaN(data.id)) {
                        switch (data.id) {
                            case 1:
                                console.log("<-- " + msg.data);
                                if (data.result) ws.myID = data.result;
                                document.getElementById("menue").innerHTML += "Client ID: " + ws.myID;
                                window.onhashchange = function () {
                                    if (/#listen+[0-9]/g.test(window.location.hash)) {
                                        window.listen = window.location.hash.match(/\d+/g);
                                    } else if (/#share/g.test(window.location.hash)) {
                                        window.share = window.share === undefined ? true : !window.share;
                                    } else if (/#realtime/g.test(window.location.hash)) {
                                        window.realtime = window.realtime === undefined ? true : !window.realtime;
                                    } else if (/#reset/g.test(window.location.hash)) {
                                        window.realtime = false;
                                        window.share = false;
                                        window.listen = 0;
                                    }
                                }
                                break;
                            case 128:
                                console.log("<-- " + msg.data);
                                window.listen = data.result;
                                break;
                            default:
                                throw "unknown response id: " + data.id;
                        }
                    } else { throw "can't handle this"; }
                } catch (e) { console.log(e); }
            };

            ws.onclose = () => {
                console.log("Connection closed.");
                ws = null;
            };

            ws.onerror = (e) => {
                console.log("error:");
                console.log(e);
                if (ws.myID)
                    document.getElementById("menue").innerHTML += ' - <i>Connection lost...</i>';
                ws = null;
            };
            window.ws = ws;
            return ws;
        } catch (e) {
            return null;
        }
    }
})(window ? window : this);