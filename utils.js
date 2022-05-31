function getClipSpaceMousePosition(e) {
    let rect = e.path[0].getBoundingClientRect();
    let cssX = e.clientX - rect.left;
    let cssY = e.clientY - rect.top;

    let normalizedX = cssX / e.path[0].clientWidth;
    let normalizedY = cssY / e.path[0].clientHeight;

    let clipX = normalizedX * 2 - 1;
    let clipY = normalizedY * -2 + 1;

    return [clipX, clipY];
};

function makeCameraMatrix(camera) {
    let zoomScale = 1 / camera.zoom;
    return m3.scale(m3.translate(m3.identity(), camera.x, camera.y), zoomScale, zoomScale);
};

function updateViewProjection(gl, camera) {
    return m3.multiply(projectionGL, m3.inverse(makeCameraMatrix(camera)))
};

function appendLabel(label, x1, y1, x2, y2, color) {
    let block = document.createElement('tr');
    let data = [];
    for (let i = 0; i < 6; i++) {
        data.push(document.createElement('td'));
    }
    data[0].innerHTML = label;
    data[1].innerHTML = x1;
    data[2].innerHTML = y1;
    data[3].innerHTML = x2;
    data[4].innerHTML = y2;
    data[5].innerHTML = color;

    for (let i = 0; i < 6; i++) {
        block.appendChild(data[i]);
    };

    return block
};

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
};
