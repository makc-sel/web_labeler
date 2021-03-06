const
    canvas = document.getElementById("canvas"),
    gl = canvas.getContext("webgl2"),
    x_pos_label = document.getElementById("x_pos"),
    y_pos_label = document.getElementById("y_pos"),
    table_orig = document.getElementById("table"),
    table = document.getElementById("labels"),
    selector_btn = document.getElementById("selector"),
    edit_btn = document.getElementById("edit"),
    drawRect_btn = document.getElementById("drawRect"),
    saveLabels_btn = document.getElementById("saveLabels"),
    resetCamera_btn = document.getElementById("resetCamera"),
    rect_x_label = document.getElementById("x"),
    rect_y_label = document.getElementById("y"),
    rect_w_label = document.getElementById("w"),
    rect_h_label = document.getElementById("h"),
    MOUSE_STATES = {
        "selector": 0,
        "edit": 1,
        "drawRect": 2
    },
    TILE_SIZE = 512;

canvas.width = 1280;
canvas.height = 720;

var mouse_state = MOUSE_STATES["selector"];

gl.canvas.width = canvas.width;
gl.canvas.height = canvas.height;

var projectionGL = m3.projection(gl.canvas.width, gl.canvas.height);

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
    zoom: 1
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

selector_btn.addEventListener("click", function () {
    mouse_state = MOUSE_STATES["selector"];
});

edit_btn.addEventListener("click", function () {
    mouse_state = MOUSE_STATES["edit"];
});

drawRect_btn.addEventListener("click", function () {
    mouse_state = MOUSE_STATES["drawRect"];
});

saveLabels_btn.addEventListener("click", function () {
    data = ""
    let rowsLengt = table_orig.rows.length;
    for (let i = 0; i < rowsLengt; i++) {
        let cells = table_orig.rows.item(i).cells;
        let cellsLength = cells.length;
        for (let j = 0; j < cellsLength; j++) {
            data += cells.item(j).innerText;
            if (j !== cellsLength - 1) {
                data += ",";
            }
        }
        data += "\n";
    }
    let filename = 'labels.csv';

    let file = new Blob([data], { type: "text/plain;charset=utf-8" });
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else {
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }

})

resetCamera_btn.addEventListener("click", function () {
    if (typeof (default_zoom) !== "undefined") {
        camera = {
            x: 0,
            y: 0,
            zoom: default_zoom
        };
    } else {
        camera = {
            x: 0,
            y: 0,
            zoom: 1
        };
    }
})

var default_zoom = 1;
var manipulator = new Manipulator(gl, camera);

var img = new Image();
img.setAttribute('crossorigin', 'anonymous');
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
    //fit image
    if ((canvas.width * img.height) > (img.width * canvas.height)) {
        default_zoom = canvas.height / img.height;
    } else {
        default_zoom = canvas.width / img.width;
    };
    camera.zoom = default_zoom;

    canvas.addEventListener("mousedown", function (e) {
        manipulator.mouse_down(e, shaderProgramBox);
    });

    canvas.addEventListener("mousewheel", function (e) {
        manipulator.mouse_wheel(e, camera);
    });

    canvas.addEventListener("mousemove", function (e) {
        manipulator.mouse_move(e, camera);
    });

    canvas.addEventListener("mouseup", function (e) {
        manipulator.mouse_up(e);
    });

    canvas.addEventListener("mouseleave", function (e) {
        manipulator.mouse_leave(e)
    });

    canvas.addEventListener("keyup", function (e) {
        manipulator.key_down(e)
    });

    requestAnimationFrame(draw);
};

img.src = "test.jpg";

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
    if (object.isSelected) {
        rect_x_label.innerText = object.x;
        rect_y_label.innerText = object.y;
        rect_w_label.innerText = object.w;
        rect_h_label.innerText = object.h;
    }
};

function draw() {
    gl.clearColor(125 / 255, 125 / 255, 125 / 255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    manipulator.viewProjectionMat = updateViewProjection(camera);

    scene.forEach(drawObject);
    bboxes.forEach(drawRect);

    x_pos_label.innerText = manipulator.mousePos[0].toFixed(3);
    y_pos_label.innerText = manipulator.mousePos[1].toFixed(3);

    requestAnimationFrame(draw);
};