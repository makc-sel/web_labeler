"use strict"

class Manipulator {
    constructor(gl, camera) {
        this.startInvViewProjectionMat = 0;
        this.startCamera = 0;
        this.startPos = 0;
        this.startClipPos = 0;
        this.startMousePos = 0;
        this.isPanning = false;
        this.isDrawing = false;
        this.mousePos = [0, 0];
        this.isSelected = false;
        this.selectedRectID = undefined;
        this.gl = gl;
        this.viewProjectionMat = updateViewProjection(gl, camera);
        this.startPoint = [];
    };

    mouse_down(e, camera, shader) {
        // Старт движения камеры
        if (e.button == 1) {
            this.isPanning = true;
            this.startInvViewProjectionMat = m3.inverse(this.viewProjectionMat);
            this.startCamera = Object.assign({}, camera);
            this.startClipPos = getClipSpaceMousePosition(e);
            this.startPos = m3.transformPoint(this.startInvViewProjectionMat, this.startClipPos);
            this.startMousePos = [e.clientX, e.clientY];
        }
        else if (e.button == 0) {
            if (mouse_state == MOUSE_STATES["selector"]) {
                this.isPanning = true;
                this.startInvViewProjectionMat = m3.inverse(this.viewProjectionMat);
                this.startCamera = Object.assign({}, camera);
                this.startClipPos = getClipSpaceMousePosition(e);
                this.startPos = m3.transformPoint(this.startInvViewProjectionMat, this.startClipPos);
                this.startMousePos = [e.clientX, e.clientY];
            }
            else if (e.button == 0 && mouse_state == MOUSE_STATES["drawRect"]) {
                this.isDrawing = true;
                this.startPoint = this.mousePos;
                this.endPoint = this.mousePos;
                bboxes.push(new Rectangle(
                    this.gl,
                    this.startPoint[0],
                    this.startPoint[1],
                    this.endPoint[0],
                    this.endPoint[1],
                    shader
                ));
            }
            else if (e.button == 0 && mouse_state == MOUSE_STATES["edit"]) {
                for (let i = 0; i < bboxes.length; i++) {
                    if (bboxes[i].pointInRect(this.mousePos[0], this.mousePos[1])) {
                        ok = true;
                        this.isSelected = true;
                        this.selectedRectID = i;
                        break;
                    }
                }
            }
        };
    };

    mouse_move(e, camera) {
        this.mousePos = m3.transformPoint(
            m3.inverse(this.viewProjectionMat),
            getClipSpaceMousePosition(e)
        );
        // Движение камеры за мышью
        if (this.isPanning) {
            let pos = m3.transformPoint(
                this.startInvViewProjectionMat,
                getClipSpaceMousePosition(e)
            );
            camera.x = this.startCamera.x + this.startPos[0] - pos[0];
            camera.y = this.startCamera.y + this.startPos[1] - pos[1];
        }
        // растягивание прямоугольника
        else if (this.isDrawing) {
            this.endPoint = this.mousePos;
            bboxes.at(-1).updatePoint(
                this.gl,
                this.startPoint[0],
                this.startPoint[1],
                this.endPoint[0],
                this.endPoint[1]
            );
        }
        else if (this.isSelected) {
            bboxes[this.selectedRectID].pointInVertex(this.mousePos[0], this.mousePos[1]);
        }
    };

    mouse_up(e) {
        // Остановка движения камеры
        if (this.isPanning) {
            this.isPanning = false;
        }
        // Остановка рисования прямоугольника
        else if (this.isDrawing) {
            this.isDrawing = false;
            // Открываем окно выбора класса
            modal.style.display = "block";
        }
    };

    mouse_leave(e) {
        // move camera
        if (this.isPanning) {
            this.isPanning = false;
        }
    };

    mouse_wheel(e, camera) {
        // move camera
        let [clipX, clipY] = getClipSpaceMousePosition(e);
        let [preZoomX, preZoomY] = m3.transformPoint(
            m3.inverse(this.viewProjectionMat),
            [clipX, clipY]
        );
        if (e.deltaY > 0) {
            camera.zoom = camera.zoom * 1.1;
        } else {
            camera.zoom = camera.zoom / 1.1;
        }
        this.viewProjectionMat = updateViewProjection(this.gl, camera);
        let [postZoomX, postZoomY] = m3.transformPoint(
            m3.inverse(this.viewProjectionMat),
            [clipX, clipY]
        );
        camera.x += preZoomX - postZoomX;
        camera.y += preZoomY - postZoomY;
    };

    key_down(e) {
        if (e.key == "Delete") {
            for (let i = 0; i < bboxes.length; i++) {
                if (bboxes[i].isSelected) {
                    bboxes.splice(i, 1);
                    break;
                }
            }
        }
    };

};