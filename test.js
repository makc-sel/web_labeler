const
    canvas = document.getElementById("canvas"),
    gl = canvas.getContext("webgl2"),
    x_pos_label = document.getElementById("x_pos"),
    y_pos_label = document.getElementById("y_pos"),
    table = document.getElementById("labels"),
    selector_btn = document.getElementById("selector"),
    edit_btn = document.getElementById("edit"),
    drawRect_btn = document.getElementById("drawRect"),
    MOUSE_STATES = {
        "selector": 0,
        "edit": 1,
        "drawRect": 2
    },
    TILE_SIZE = 512;

canvas.width = 1280;
canvas.height = 720;

var mouse_state = MOUSE_STATES["selector"];

selector_btn.addEventListener("click", function () {
    mouse_state = MOUSE_STATES["selector"];
    console.log('selector');
});

edit_btn.addEventListener("click", function () {
    mouse_state = MOUSE_STATES["edit"];
    console.log('edit');
});

drawRect_btn.addEventListener("click", function () {
    mouse_state = MOUSE_STATES["drawRect"];
    console.log('drawRect');
});

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
var CLASSES = {};

const
    modal = document.getElementById("myModal"),
    color = document.getElementById("color_input"),
    class_selector = document.getElementById("class_selector"),
    class_name = document.getElementById("class_name"),
    apply_label_button = document.getElementById("apply_label_button"),
    discard_label_button = document.getElementById("discard_label_button");

apply_label_button.addEventListener("click", function (e) {
    // Если индекс селектора 0 значит класс не выбран и мы должны его создать
    if (class_selector.selectedIndex == 0) {
        // Проверяем отсутствие класса, написанного в элементе class_name, в списке классов
        // если класс отсутсвует, то добавляем его в словарь
        // если класс существует, то используем данные цвета из него
        // и добавляем полученный прямоугольник в список 
        if (typeof CLASSES[class_name.value] == "undefined") {
            CLASSES[class_name.value] = hexToRgb(color.value);
            let option = document.createElement('option');
            option.innerText = class_name.value;
            option.value = Object.keys(CLASSES).length;
            class_selector.appendChild(option);
            table.appendChild(
                appendLabel(
                    class_name.value,
                    bboxes.at(-1).x.toFixed(2),
                    bboxes.at(-1).y.toFixed(2),
                    bboxes.at(-1).w.toFixed(2),
                    bboxes.at(-1).h.toFixed(2),
                    CLASSES[class_name.value]
                )
            );
            bboxes.at(-1).resetTexture(CLASSES[class_name.value]);
        } else {
            table.appendChild(
                appendLabel(
                    class_name.value,
                    bboxes.at(-1).x.toFixed(2),
                    bboxes.at(-1).y.toFixed(2),
                    bboxes.at(-1).w.toFixed(2),
                    bboxes.at(-1).h.toFixed(2),
                    CLASSES[class_name.value]
                )
            );
            bboxes.at(-1).resetTexture(CLASSES[class_name.value]);
        }
    } else {
        table.appendChild(appendLabel(
            class_selector.options[class_selector.selectedIndex].text,
            bboxes.at(-1).x.toFixed(2),
            bboxes.at(-1).y.toFixed(2),
            bboxes.at(-1).w.toFixed(2),
            bboxes.at(-1).h.toFixed(2),
            CLASSES[class_selector.options[class_selector.selectedIndex].text])
        );
        bboxes.at(-1).resetTexture(CLASSES[class_selector.options[class_selector.selectedIndex].text]);
    }
    class_selector.value = 0;
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
    for (let i = 0; i < img.width / TILE_SIZE; i++) {
        for (let j = 0; j < img.height / TILE_SIZE; j++) {
            scene.push(getTileFromImage(gl, ctx, TILE_SIZE, TILE_SIZE, i * TILE_SIZE, j * TILE_SIZE, i * TILE_SIZE, j * TILE_SIZE, shaderProgramTile));
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

img.src = "test2.jpg";

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
};

function draw() {
    gl.clearColor(102 / 255, 102 / 255, 102 / 255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    manipulator.viewProjectionMat = updateViewProjection(gl, camera);
    scene.forEach(drawObject);
    bboxes.forEach(drawRect);
    x_pos_label.innerText = manipulator.mousePos[0];
    y_pos_label.innerText = manipulator.mousePos[1];

    requestAnimationFrame(draw);
};