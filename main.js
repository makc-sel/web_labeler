const x_pos_label = document.getElementById("x_pos");
const y_pos_label = document.getElementById("y_pos");

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

const table = document.getElementById("labels");


canvas.width = 1920;
canvas.height = 1080;

gl.canvas.width = canvas.width;
gl.canvas.height = canvas.height;

gl.enable(gl.BLEND);
gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

var shaderProgramTile = twgl.createProgramInfo(gl, [vs, fsTile]);
var shaderProgramBox = twgl.createProgramInfo(gl, [vs, fsBox]);

var scene = [];
var bboxes = [];
var selected = 0;

var camera = {
    x: 0,
    y: 0,
    zoom: 0.1
};
//переделать на dict
var CLASSES = [];

const modal = document.getElementById("myModal");
const color = document.getElementById("color_input");
const class_selector = document.getElementById("class_selector");
const class_name = document.getElementById("class_name");
const apply_label_button = document.getElementById("apply_label_button");
const discard_label_button = document.getElementById("discard_label_button");

apply_label_button.addEventListener("click", function (e) {
    if (class_selector.selectedIndex == 0) {
        CLASSES.push({
            name: class_name.value,
            rgb: hexToRgb(color.value)
        });
        let option = document.createElement('option');
        option.innerText = class_name.value;
        option.value = CLASSES.length;
        class_selector.appendChild(option);
        table.appendChild(appendLabel(
            CLASSES.at(-1).name,
            bboxes.at(-1).x.toFixed(2),
            bboxes.at(-1).y.toFixed(2),
            bboxes.at(-1).w.toFixed(2),
            bboxes.at(-1).h.toFixed(2),
            CLASSES.at(-1).rgb)
        );
        bboxes.at(-1).resetTexture(CLASSES.at(-1).rgb);
    } else {
        table.appendChild(appendLabel(
            CLASSES[class_selector.selectedIndex - 1].name,
            bboxes.at(-1).x.toFixed(2),
            bboxes.at(-1).y.toFixed(2),
            bboxes.at(-1).w.toFixed(2),
            bboxes.at(-1).h.toFixed(2),
            CLASSES[class_selector.selectedIndex - 1].rgb)
        );
        bboxes.at(-1).resetTexture(CLASSES[class_selector.selectedIndex - 1].rgb);
    }
    modal.style.display = "none";
});

discard_label_button.addEventListener("click", function (e) {
    bboxes.pop();
    modal.style.display = "none";
});


var manipulator = new Manipulator(gl, camera);

var img = new Image();

img.onload = function () {
    let ctx = document.createElement("canvas").getContext("2d");
    ctx.canvas.width = img.width;
    ctx.canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    for (let i = 0; i < img.width / 256; i++) {
        for (let j = 0; j < img.height / 256; j++) {
            scene.push(getTileFromImage(gl, ctx, 256, 256, i * 256, j * 256, i * 256, j * 256, shaderProgramTile));
        };
    };
    canvas.addEventListener("mousedown", function (e) {
        manipulator.mouse_down(e, camera, shaderProgramBox)
    });

    canvas.addEventListener("mousewheel", function (e) {
        manipulator.mouse_wheel(e, camera)
    });

    canvas.addEventListener("mousemove", function (e) {
        manipulator.mouse_move(e, camera)
    });

    canvas.addEventListener("mouseup", function (e) {
        manipulator.mouse_up(e, table)
    });

    canvas.addEventListener("mouseleave", function (e) {
        manipulator.mouse_leave(e)
    });

    canvas.addEventListener("keyup", function (e) {
        manipulator.key_down(e)
    });

    requestAnimationFrame(draw);
};

img.src = "test4.jpg";

function drawObject(object) {
    gl.useProgram(object.shaderProgram.program);
    twgl.setBuffersAndAttributes(gl, object.shaderProgram, object.bufferInfo);
    twgl.setUniforms(object.shaderProgram, {
        u_image: object.texture,
        u_matrix: manipulator.viewProjectionMat
    });
    twgl.drawBufferInfo(gl, object.bufferInfo, gl.TRIANGLE);
};

function drawRect(object) {
    object.draw(gl, {
        u_image: object.isSelected ? object.hoverTexture : object.texture,
        u_matrix: manipulator.viewProjectionMat
    });
    object.pointInRect(manipulator.mousePos[0], manipulator.mousePos[1]);
};

function draw() {
    gl.clearColor(102 / 255, 102 / 255, 102 / 255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    manipulator.viewProjectionMat = updateViewProjection(gl, camera);
    scene.forEach(drawObject);
    bboxes.forEach(drawRect);
    x_pos_label.innerText = manipulator.mousePos[0];
    y_pos_label.innerText = manipulator.mousePos[1];

    requestAnimationFrame(draw);
};

