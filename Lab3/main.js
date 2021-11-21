'use strict';

let gl;                       
let iAttribVertex;              
let iAttribTexture;           
let iColor;                     
let iColorCoef;               
let iModelViewProjectionMatrix; 
let iTextureMappingUnit;
let iVertexBuffer;              
let iIndexBuffer;              
let iTexBuffer;                 
let spaceball;                  
let isFrame = false;
let distance = 7;

let deviceOrientation = {
    alpha: 0,
    beta: 0,
    gamma: 0
}
const coef = Math.PI / 180;


function getRotationMatrix(a, b, g) {
    const x1 = Math.cos(b ? b * coef : 0);
    const y1 = Math.cos(g ? g * coef : 0);
    const z1 = Math.cos(a ? a * coef : 0);
    const x2 = Math.sin(b ? b * coef : 0);
    const y2 = Math.sin(g ? g * coef : 0);
    const z2 = Math.sin(a ? a * coef : 0);

    const mat11 = z1 * y1 - z2 * x2 * y2;
    const mat12 = -x1 * z2;
    const mat13 = y1 * z2 * x2 + z1 * y2;

    const mat21 = y1 * z2 + z1 * x2 * y2;
    const mat22 = z1 * x1;
    const mat23 = z2 * y2 - z1 * y1 * x2;

    const mat31 = -x1 * y2;
    const mat32 = x2;
    const mat33 = x1 * y1;


    return [
        mat11, mat12, mat13, 0,
        mat21, mat22, mat23, 0,
        mat31, mat32, mat33, 0,
        0, 0, 0, 1
    ];
}


function drawPrimitive(primitiveType, color, vertices, texCoords) {
    gl.uniform4fv(iColor, color);
    gl.uniform1f(iColorCoef, 0.0);

    gl.enableVertexAttribArray(iAttribVertex);
    gl.bindBuffer(gl.ARRAY_BUFFER, iVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    gl.vertexAttribPointer(iAttribVertex, 3, gl.FLOAT, false, 0, 0);

    if (texCoords) {
        gl.enableVertexAttribArray(iAttribTexture);
        gl.bindBuffer(gl.ARRAY_BUFFER, iTexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STREAM_DRAW);
        gl.vertexAttribPointer(iAttribTexture, 2, gl.FLOAT, false, 0, 0);
    } else {
        gl.disableVertexAttribArray(iAttribTexture);
        gl.vertexAttrib2f(iAttribTexture, 0.0, 0.0);
        gl.uniform1f(iColorCoef, 1.0);
    }

    gl.drawArrays(primitiveType, 0, vertices.length / 3);
}



function draw() {
    _resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    let projection = m4.perspective(Math.PI / distance, 2, 2, 12);

    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum1 = m4.multiply(translateToPointZero, getRotationMatrix(deviceOrientation.alpha, deviceOrientation.beta, deviceOrientation.gamma));

    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniform1i(iTextureMappingUnit, 0);


    //Drawing surface
    const vertices = [];
    const texCoords = [];
    const indices = [];

    const a = 0.20; //from book
    const b = 0.20;
    const c = 0.20;
    const N = 80;

    for (let i = 0; i <= N; i++) {
        let l = i / N;
        for (let j = 0; j <= N; j++) {
            let k = j / N;
            let u = l * Math.PI * 2;
            let v = k * Math.PI * 2;

            let x = a * u * Math.sin(u) * Math.cos(v);
            let y = b * u * Math.cos(u) * Math.cos(v);
            let z = -c * u * Math.sin(v);

            vertices.push(x);
            vertices.push(y);
            vertices.push(z);

            const texCoord1 = j / N;
            const texCoord2 = i / N;
            texCoords.push(texCoord1);
            texCoords.push(texCoord2);
        }
    }

    for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
            const index1 = j * (N + 1) + i;
            const index2 = index1 + (N + 1);
            indices.push(index1);
            indices.push(index2);
            indices.push(index1 + 1);
            indices.push(index1 + 1);
            indices.push(index2);
            indices.push(index2 + 1);
        }
    }


    gl.uniform4fv(iColor, [0.1, 0.2, 0.7, 1]);
    gl.uniform1f(iColorCoef, 0.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, iVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STREAM_DRAW);

    // textures
    if (isFrame) {
        gl.disableVertexAttribArray(iAttribTexture);
        gl.vertexAttrib2f(iAttribTexture, 0.0, 0.0);
        gl.uniform1f(iColorCoef, 1.0);

        gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_SHORT, 0);
    } else {
        gl.enableVertexAttribArray(iAttribTexture);
        gl.bindBuffer(gl.ARRAY_BUFFER, iTexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STREAM_DRAW);
        gl.vertexAttribPointer(iAttribTexture, 2, gl.FLOAT, false, 0, 0);

        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }


    gl.lineWidth(4);
    drawPrimitive(gl.LINES, [1, 0, 0, 1], [-2, 0, 0, 2, 0, 0]);
    drawPrimitive(gl.LINES, [0, 1, 0, 1], [0, -2, 0, 0, 2, 0]);
    drawPrimitive(gl.LINES, [0, 0, 1, 1], [0, 0, -2, 0, 0, 2]);
    gl.lineWidth(1);

}

function _resizeCanvasToDisplaySize(canvas) {
    const dpr = window.devicePixelRatio;
    const {width, height} = canvas.getBoundingClientRect();
    const displayWidth = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);

    const needResize = canvas.width !== displayWidth ||
        canvas.height !== displayHeight;

    if (needResize) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    return needResize;
}


async function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource );
    gl.useProgram(prog);

    iAttribVertex = gl.getAttribLocation(prog, "vertex");
    iAttribTexture = gl.getAttribLocation(prog, "texCoord");

    iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    iColor = gl.getUniformLocation(prog, "color");
    iColorCoef = gl.getUniformLocation(prog, "fColorCoef");
    iTextureMappingUnit = gl.getUniformLocation(prog, "u_texture");

    iVertexBuffer = gl.createBuffer();
    iIndexBuffer = gl.createBuffer();
    iTexBuffer = gl.createBuffer();

    LoadTexture();

    gl.enable(gl.DEPTH_TEST);


}

function LoadTexture() {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = "https://webglfundamentals.org/webgl/resources/f-texture.png";
    image.addEventListener('load', () => {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        draw();
    });
}


function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }

    return prog;
}


async function init() {
    window.addEventListener('deviceorientation', (e) => {
        deviceOrientation.alpha = e.alpha;
        deviceOrientation.beta = e.beta;
        deviceOrientation.gamma = e.gamma;
        draw()
    })


    let canvas;
    try {
        canvas = document.getElementById("draw");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        document.getElementById('block').hidden = true;
        return;
    }
    try {
        await initGL();
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        document.getElementById('block').hidden = true;
        return;
    }
    spaceball = new TrackballRotator(canvas, draw, 0);
    draw();
}
function showFrame(){
    isFrame = !isFrame;
    draw()
}
