/**
 * @name pixel.js
 *
 * - color detection
 * - rgb to hsv translation
 * - canvas constructor for easy image data manipulation
 * - filter functions
 * - similarity/difference of color vectors
 * 
 * @author Konstantin Ruppel
 * @version 1.1 [17/04/15]
 */

((window) => {
    var pixel = window.pixel = {};
    pixel.shadow = 1;
    pixel.light = 1;
    navigator.getMedia = getMedia();
    pixel.luminosity = 1000;

    // Light sensor supported by MS Edge only...
    window.addEventListener("devicelight", function (event) {
        pixel.luminosity = event.value > 10000 ? 10000 : event.value;
    });

    /**
     * Calculates the distance (0 - 442) between a and b.
     * 
     * @name dis
     * @param {number[]} a first color vector [r, g, b]
     * @param {number[]} b second color vector [r, g, b]
     * @returns {number} ([number, number, number], [number, number, number]) => number
     */
    pixel.dis = function (a, b) {
        var v = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    };

    /**
     * Returns true if vector a points to the same direction as b does, with an accuracy of 1 - e.
     * By default e = 10 %. 
     * @name towards
     * @param {number[]} a first color vector [r, g, b]
     * @param {number[]} b second color vector [r, g, b]
     * @returns {number} ([number, number, number], [number, number, number]) => boolean
     */
    pixel.towards = function (a, b, e) {
        e = e || 0.1;
        var maxA = Math.max(a[0], Math.max(a[1], a[2]));
        var maxB = Math.max(b[0], Math.max(b[1], b[2]));
        return Math.abs(a[0] / maxA - b[0] / maxB) < e && Math.abs(a[1] / maxA - b[1] / maxB) < e && Math.abs(a[2] / maxA - b[2] / maxB) < e;
    }

    /**
     * Calculates the degree (0 - 1) of similarity between a and b.
     * 
     * @name isColor
     * @param {number[]} a first color vector [r, g, b]
     * @param {number[]} b second color vector [r, g, b]
     * @returns {number} ([number, number, number], [number, number, number]) => number
     */
    pixel.sim = function (a, b) {
        var x = 1 - (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 255;
        return x < 0 ? 0 : x;
    }

    /**
     * Calculates the HSV vector for a given RGB vector.
     * 
     * @name hsv
     * @param {number} r red (0 - 255)
     * @param {number} g green (0 - 255)
     * @param {number} b blue (0 - 255)
     * 
     * @returns {number[]} (number, number, number) => [number, number, number]
     */
    pixel.HSV = function (r, g, b) {
        r = r / 255; g = g / 255; b = b / 255;
        var maxRGB = Math.max(r, Math.max(g, b));
        var minRGB = Math.min(r, Math.min(g, b));
        return (maxRGB == minRGB) ? [0, 0, r] :
            [60 * (((r == minRGB) ? 3 :
                ((b == minRGB) ? 1 : 5)) - ((r == minRGB) ? g - b :
                    ((b == minRGB) ? r - g : b - r)) / (maxRGB - minRGB)),
            (maxRGB - minRGB) / maxRGB, maxRGB];
    };

    /**
     * Calculates the hue value for a given RGB vector.
     * Faster than pixel.HSV(r, g, b)[0], if you are interested in hue only.
     * 
     * @name Hsv
     * @param {number} r red (0 - 255)
     * @param {number} g green (0 - 255)
     * @param {number} b blue (0 - 255)
     * 
     * @returns {number} (number, number, number) => number
     */
    pixel.Hsv = function (r, g, b) {
        r = r / 255; g = g / 255; b = b / 255;
        var maxRGB = Math.max(r, Math.max(g, b));
        var minRGB = Math.min(r, Math.min(g, b));
        return (maxRGB == minRGB) ? 0 :
            60 * (((r == minRGB) ? 3 :
                ((b == minRGB) ? 1 : 5)) - ((r == minRGB) ? g - b :
                    ((b == minRGB) ? r - g : b - r)) / (maxRGB - minRGB));
    }

    /**
     * Calculates the situration value for a given RGB vector.
     * Faster than pixel.hsv(r, g, b)[1], if you are interested in situration only.
     * 
     * @name getSituration
     * @param {number} r red (0 - 255)
     * @param {number} g green (0 - 255)
     * @param {number} b blue (0 - 255)
     * 
     * @returns {number} (number, number, number) => number
     */
    pixel.hSv = function (r, g, b) {
        var maxRGB = Math.max(r, Math.max(g, b));
        return (maxRGB - Math.min(r, Math.min(g, b))) / maxRGB;
    }

    /**
     * Calculates the brightness/darkness level for a given RGB vector.
     * Faster than pixel.hsv(r, g, b)[2], if you are interested in brightness/darkness
     * value only.
     * 
     * @name hsV
     * @param {number} r red (0 - 255)
     * @param {number} g green (0 - 255)
     * @param {number} b blue (0 - 255)
     * 
     * @returns {number} (number, number, number) => number
     */
    pixel.hsV = function (r, g, b) {
        return Math.max(r, Math.max(g, b)) / 255;
    };

    /**
     * AWESOME CANVAS CONSTRUCTOR!!!
     * You can use it in many ways. Especially to do pixel manipulation
     * on stream data of your webcam.
     * 
     * @param {number} w width
     * @param {number} h height
     * @param {boolean} mirror flip horizontally
     */
    pixel.Art = function (w, h, mirror) {
        var cnvs = document.createElement("canvas");
        cnvs.width = w; cnvs.height = h;
        var ctx = cnvs.getContext("2d");
        if (mirror) {
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
        };
        this.context = ctx;
        this.canvas = cnvs;
        var video = null; // overlay

        this.appendTo = function (element) {
            element.appendChild(cnvs);
        }

        this.drawImageByVideo = function (vid) {
            ctx.drawImage(vid ? vid : video, 0, 0, w, h);
        }

        this.getImage = function () {
            return ctx.getImageData(0, 0, w, h);
        }

        this.getImageData = function () {
            return this.getImage().data;
        }

        this.setImage = function (img) {
            ctx.putImageData(img, 0, 0);
        }

        /**
         * Manipulates the image.data objects which contains all pixel data for
         * the current frame. 
         * @param {function} fn function literal that takes an image.data object
         */
        this.manipulateImageData = function (fn) {
            var img = this.getImage();
            fn(img.data);
            this.setImage(img);
        }
        /**
         * Returns a <div> element which can be attached to the DOM.
         * It contains a <video> and a <canvas>-overlay element.
         * The <canvas> element displays the current <video>-frame.
         * 
         * @param {function} drawcallback function being executed for
         * each requested animation frame.
         * 
         * @returns {element} (function) => element <div><canvas><video></div>
         * 
         */
        this.setupVideoOverlay = function (drawcallback) {
            var div = document.createElement("div");
            video = document.createElement("video");
            var url = getUrl();

            video.width = w; video.height = h;
            div.style["width"] = w;
            div.style["height"] = h;
            div.style["position"] = "relative";
            cnvs.style["position"] = video.style["position"] = "absolute";
            cnvs.style["z-index"] = "10";
            cnvs.style["left"] = video.style["left"] = "0";
            cnvs.style["top"] = video.style["left"] = "0";
            if (mirror) video.style["transform"] = "rotateY(180deg)";
            this.appendTo(div);
            div.appendChild(video);

            navigator.getMedia(
                { video: true, audio: false },
                (stream) => { video.src = url.createObjectURL(stream); video.play(); },
                (e) => { console.log(e); });
            video.addEventListener('play', () => { drawcallback(); });
            return div;
        }
    }

    /**
     * Returns a function literal for a given name, which can be used for
     * pixel.Art.manipulateImageData
     * 
     * @name filter
     * @param {string} name ["binarize", "cartoonize", "quantize","decolorize"]
     * @returns (string) => function
     */
    pixel.filter = function (name) {
        switch (name) {
            case "binarize":
                return function (data) {
                    for (var i = 0; i < data.length; i += 4) {
                        var x = data[i] + data[i + 1] + data[i + 2];
                        if (x * pixel.light < 200) {
                            data[i] = data[i + 1] = data[i + 2] = 0;
                        } else {
                            data[i] = data[i + 1] = data[i + 2] = 255;
                        }
                    }
                };

            case "cartoonize":
                return function (data) {
                    for (var i = 0; i < data.length; i += 4) {
                        var x = data[i] + data[i + 1] + data[i + 2];
                        if (x < 150) {
                            data[i] = data[i + 1] = data[i + 2] = 0;
                        } else if (x > 600) {
                            data[i] = data[i + 1] = data[i + 2] = 255;
                        }
                    }
                };

            case "quantize":
                return function (data) {
                    for (var i = 0; i < data.length; i += 4) {
                        data[i] &= 1100000;
                        data[i + 1] &= 1100000;
                        data[i + 2] &= 1100000;
                    }
                };

            case "decolorize":
                return function (data) {
                    for (var i = 0; i < data.length; i += 4) {
                        var x = data[i] + data[i + 1] + data[i + 2];
                        data[i] = data[i + 1] = data[i + 2] = Math.max(data[i], Math.max(data[i + 1], data[i + 2])) * pixel.light;
                    }
                };

            case "colorize":
                return function (data) {
                    for (var i = 0; i < data.length; i += 4) {
                        var av = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        data[i] = data[i] * data[i] / av;
                        data[i + 1] = data[i + 1] * data[i + 1] / av;
                        data[i + 2] = data[i + 2] * data[i + 2] / av;
                    }
                };
            default:
                return function (data) { };
        }
    }

    // Colorcheck
    pixel.isRed = function (r, g, b) {
        g += 1; b += 1;
        return r * pixel.shadow > 100 && r * pixel.light / g > 3 && r * pixel.light / b > 3 && Math.abs(g - b) < 40;
    }
    pixel.isGreen = function (r, g, b) {
        // return g * pixel.shadow > 80 && g * pixel.light / r > 3.8 && g * pixel.light / b > 3.8 && Math.abs(r - b) < 100;
        return g * pixel.shadow > 50 && Math.abs(g - b) < 50 && g + b > r * 10;
    }
    pixel.isBlue = function (r, g, b) {
        r += 1; g += 1;
        return b * pixel.shadow > 100 && b * pixel.light / r > 3 && b * pixel.light / g > 2;
    }
    pixel.isYellow = function (r, g, b) {
        b += 1;
        // return r * pixel.shadow > 130 && Math.abs(g - r) < 20 && (r + g) / 2 * pixel.light / b > 2.8;
        return r * pixel.shadow > 130 && Math.abs(g - r) < 20 && (r + g) / 2 * pixel.light / b > 1.5;
    }
    pixel.isMagenta = function (r, g, b) {
        g += 1;
        return r * pixel.shadow > 90 && Math.abs(b - r) < 30 && (r + b) / 2 * pixel.light / g > 2.5;
    }
    pixel.isCyan = function (r, g, b) {
        r += 1;
        return g * pixel.shadow > 120 && Math.abs(b - g) < 20 && (g + b) / 2 * pixel.light / r > 3;
    }
    pixel.isOrange = function (r, g, b) {
        g++;
        return r / g > 1.7 && r / g < 3 && b < 50 && r + g + b < 400 && r + g + b > 100;
    }
    pixel.isYellowGreen = function (r, g, b) {
        r++;
        return g / r > 1.7 && g / r < 3 && b < 50 && r + g + b < 400 && r + g + b > 100;
    }
    pixel.isSpringGreen = function (r, g, b) {
        b++;
        return g / b > 1.7 && g / b < 3 && r < 50 && r + g + b < 400 && r + g + b > 100;
    }
    pixel.isDeepSkyBlue = function (r, g, b) {
        g++;
        return b / g > 1.7 && b / g < 3 && r < 50 && r + g + b < 400 && r + g + b > 100;
    }
    pixel.isDeepPink = function (r, g, b) {
        b++;
        return r / b > 1.7 && r / b < 3 && g < 50 && r + g + b < 400 && r + g + b > 100;
    }

    // Browser compatibility
    function getMedia() {
        return navigator.getUserMedia
            || navigator.webkitGetUserMedia
            || navigator.mozGetUserMedia
            || navigator.msGetUserMedia;
    }
    function getUrl() {
        return window.URL || window.webkitURL;
    }

    return pixel;
})(window ? window : this);