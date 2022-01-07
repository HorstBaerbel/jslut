
function replaceMath(input) {
    // replace constants
    input = input.replace(/E/g, "Math.E");
    input = input.replace(/PI/g, "Math.PI");
    // replace functions
    input = input.replace(/abs/g, "Math.abs");
    input = input.replace(/acos/g, "Math.acos");
    input = input.replace(/asin/g, "Math.asin");
    input = input.replace(/atan/g, "Math.atan");
    input = input.replace(/atan2/g, "Math.atan2");
    input = input.replace(/ceil/g, "Math.ceil");
    input = input.replace(/cos/g, "Math.cos");
    input = input.replace(/exp/g, "Math.exp");
    input = input.replace(/floor/g, "Math.floor");
    input = input.replace(/log/g, "Math.log");
    input = input.replace(/max/g, "Math.max");
    input = input.replace(/min/g, "Math.min");
    input = input.replace(/pow/g, "Math.pow");
    input = input.replace(/random/g, "Math.random");
    input = input.replace(/round/g, "Math.round");
    input = input.replace(/sin/g, "Math.sin");
    input = input.replace(/sqrt/g, "Math.sqrt");
    input = input.replace(/tan/g, "Math.tan");
    return input;
}

function evaluateFunction(equation) {
    eval("var f = function () { return " + replaceMath(equation) + "}");
    return f();
}

function makeFunction(equation) {
    eval("var f = function (x,i,n) { return " + replaceMath(equation) + "}");
    return f;
}

function generateValues() {
    // get input values
    var xstart = parseFloat(evaluateFunction(document.getElementById('xstart').value));
    var xend = parseFloat(evaluateFunction(document.getElementById('xend').value));
    var n = parseInt(evaluateFunction(document.getElementById('count').value));
    // create array to store values in
    var valueArray = [];
    // build function from user equation
    var f = makeFunction(document.getElementById('equation').value);
    // calculate values
    for (var i = 0; i < n; i++) {
        // calculate running x
        var x = xstart + (((xend - xstart) * i) / (n - 1));
        // run user function on x with index i and count n
        var value = f(x, i, n);
        // store result in array
        valueArray.push(value);
    }
    return [valueArray, xstart, xend];
}

//------------------------------------------------------------------------------

function getBitdepth() {
    switch (document.querySelector('input[name="bitdepth"]:checked').value) {
        case "uint32_t":
        case "int32_t":
        case "float":
            return 32;
        case "uint16_t":
        case "int16_t":
            return 16;
        default:
            return 8;
    }
}

function getLimits() {
    switch (document.querySelector('input[name="bitdepth"]:checked').value) {
        case "float":
            return [1.175494351e-38, 3.402823466e+38];
        case "uint32_t":
            return [0, 2 ^ 32 - 1];
        case "int32_t":
            return [-2147483648, 2147483647];
        case "uint16_t":
            return [0, 65535]
        case "int16_t":
            return [-32768, 32767]
        case "uint8_t":
            return [0, 255];
        case "int8_t":
            return [-128, 127];
        default:
            return 0;
    }
}

function toIntString(valueArray, base, breakafter = 10) {
    var out = "";
    for (var i = 0; i < valueArray.length; i++) {
        var str = valueArray[i].toString(base).toUpperCase();
        if (base == 2) {
            str = "0b" + str;
        }
        else if (base == 16) {
            if (valueArray[i] < 0) {
                str = str[0] + "0x" + str.substring(2);
            }
            else {
                str = "0x" + str;
            }
        }
        out += str + ", ";
        if ((i > 0) && (i % breakafter) == 0) {
            out += "\n";
        }
    }
    return out;
}

function convertValues(params) {
    // get input values
    var valueArray = params[0];
    var bitdepth = getBitdepth();
    var limits = getLimits();
    var isFloat = (document.querySelector('input[name="bitdepth"]:checked').value == "float");
    // check if we need to round
    if (isFloat == true) {
        // floats are rounded to 10 decimal places, enough for a 32bit integer
        for (var i = 0; i < valueArray.length; i++) {
            valueArray[i] = parseFloat(valueArray[i].toFixed(10));
        }
    }
    else {
        // if we want integers we need to truncate
        for (var i = 0; i < valueArray.length; i++) {
            valueArray[i] = Math.trunc(valueArray[i]);
        }
    }
    // get min/max value range
    var miny = limits[1];
    var maxy = limits[0];
    for (var i = 0; i < valueArray.length; i++) {
        miny = valueArray[i] < miny ? valueArray[i] : miny;
        maxy = valueArray[i] > maxy ? valueArray[i] : maxy;
    }
    // check if values need signs
    /*if (miny < 0 || maxy < 0) {
        //value MUST be signed. check
        if (!isSigned) {
            document.getElementById('error').innerHTML += "Warning: Results are signed, but selected output format is not! Result will be b0rked...";
        }
    }*/
    // check if range is ok
    if (miny < limits[0] || maxy > limits[1]) {
        if (document.getElementById('error').innerHTML != "") {
            document.getElementById('error').innerHTML += "<br />"
        }
        document.getElementById('error').innerHTML += "Warning: Output range is [" + limits[0] + ", " + limits[1] + "], but values are in range [" + miny + ", " + maxy + "]! Result will be b0rked...";
    }
    // print minimum/maximum values
    document.getElementById("output").value = "Minimum = " + miny + "\n";
    document.getElementById("output").value += "Maximum = " + maxy + "\n";
    // convert values to integers
    if (document.querySelector('input[name="format"]:checked').value == "base16") {
        document.getElementById("output").value += toIntString(valueArray, 16);
    }
    else if (document.querySelector('input[name="format"]:checked').value == "base16_2sc") {
        // convert numbers to 2's complement
        var complementValue = (bitdepth == 8 ? 0xFF : (bitdepth == 16 ? 0xFFFF : (bitdepth == 32 ? 0xFFFFFFFF : 0)));
        // do deep copy of array, else we're changing it
        var complementArray = [];
        for (var i = 0; i < valueArray.length; i++) {
            if (valueArray[i] < 0) {
                complementArray[i] = complementValue + valueArray[i] + 1;
            }
            else {
                complementArray[i] = valueArray[i];
            }
        }
        document.getElementById("output").value += toIntString(complementArray, 16);
    }
    else {
        document.getElementById("output").value += toIntString(valueArray, 10);
    }
    return [valueArray, params[0], params[1], miny, maxy];
}

//------------------------------------------------------------------------------

function drawValues(params) {
    // get canvas element
    var canvas = document.getElementById('canvas');
    // get drawing context from canvas element
    var ctx = canvas.getContext("2d");
    // check if that worked ans we have a valid context
    if (!canvas || !canvas.getContext) {
        alert("No canvas or context. Your browser sucks!");
        return;
    }
    var width = canvas.width;
    var height = canvas.height;
    // calculate scale factors
    var valueArray = params[0];
    var ystart = params[3];
    var yend = params[4];
    if (yend < ystart) {
        ytemp = yend; yend = ystart; ystart = ytemp;
    }
    var yscale = height / (yend - ystart);
    var xscale = width / (valueArray.length - 1);
    // draw values
    ctx.beginPath();
    var prevY = (valueArray[0] - ystart) * yscale;
    ctx.moveTo(0, height - prevY);
    for (var x = 1; x < valueArray.length; x++) {
        ctx.lineTo(x * xscale, height - prevY);
        var y = (valueArray[x] - ystart) * yscale;
        ctx.lineTo(x * xscale, height - y);
        prevY = y;
    }
    ctx.stroke();
}

function generate() {
    // clear error string
    document.getElementById("error").innerHTML = "";
    // run function for range
    var values = generateValues();
    // convert values to output format
    values = convertValues(values);
    // draw values in canvas
    drawValues(values);
}
