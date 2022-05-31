"use strict"

class Manipulator {
    constructor(gl, camera) {
        this.startInvViewProjectionMat = 0;
        this.startPos = 0;
        this.startClipPos = 0;
        this.startMousePos = 0;
        this.isPanning = false;
        this.isDrawing = false;
        this.mousePos = [0, 0];

        this.isDragRectVertex = false;
        this.isDragRect = false;
        this.inRect = false;
        this.inRectVertex = false;
        this.startDragRect = [];
        this.selectedRectID = undefined;

        this.gl = gl;
        this.viewProjectionMat = updateViewProjection(this.gl, camera);
        this.startPoint = [];
    };

    mouse_down(e, shader) {
        // Старт движения камеры
        if (e.button == 1) {
            this.isPanning = true;
            this.startInvViewProjectionMat = m3.inverse(this.viewProjectionMat);
            this.startClipPos = getClipSpaceMousePosition(e);
            this.startPos = m3.transformPoint(this.startInvViewProjectionMat, this.startClipPos);
            this.startMousePos = [e.clientX, e.clientY];
        }
        else if (e.button == 0) {
            switch (mouse_state) {
                case MOUSE_STATES["selector"]:
                    this.isPanning = true;
                    this.startInvViewProjectionMat = m3.inverse(this.viewProjectionMat);
                    this.startClipPos = getClipSpaceMousePosition(e);
                    this.startPos = m3.transformPoint(this.startInvViewProjectionMat, this.startClipPos);
                    this.startMousePos = [e.clientX, e.clientY];
                    break;
                case MOUSE_STATES["drawRect"]:
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
                    break;
                case MOUSE_STATES["edit"]:
                    if (this.inRectVertex) {
                        this.isDragRectVertex = true;
                    } else if (this.inRect) {
                        this.isDragRect = true;
                        this.startDragRect = this.mousePos;
                    };
                    break;
                default:
                    break;
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
            camera.x += this.startPos[0] - pos[0];
            camera.y += this.startPos[1] - pos[1];
            this.startPos[0] = pos[0];
            this.startPos[1] = pos[1];
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
        else if (mouse_state == MOUSE_STATES["edit"]) {
            if (this.isDragRect) {
                let offsetX = this.mousePos[0] - this.startDragRect[0];
                let offsetY = this.mousePos[1] - this.startDragRect[1];
                bboxes[this.selectedRectID].dragRect(offsetX, offsetY);
                this.startDragRect = this.mousePos;
            } else if (this.isDragRectVertex) {
                bboxes[this.selectedRectID].dragVertex(this.mousePos[0], this.mousePos[1]);
            } else {
                for (let i = bboxes.length - 1; i >= 0; i--) { // баг при движении через линию
                    if (bboxes[i].pointInRect(this.mousePos[0], this.mousePos[1])) {
                        this.selectedRectID = i;
                        if (bboxes[i].pointInVertex(this.mousePos[0], this.mousePos[1])) {
                            this.inRectVertex = true;
                        } else {
                            this.inRect = true;
                        };
                        break;
                    } else {
                        this.inRect = false;
                        this.inRectVertex = false;
                    }
                }
            }
        }
    };

    mouse_up(e) {
        if (this.isPanning) {
            this.isPanning = false;
        } else if (this.isDrawing) {
            this.isDrawing = false;
            modal.style.display = "block";
        } else if (this.isDragRect) {
            this.isDragRect = false;
        } else if (this.isDragRectVertex) {
            this.isDragRectVertex = false;
        };
    };

    mouse_leave(e) {
        if (this.isPanning) {
            this.isPanning = false;
        };
    };

    mouse_wheel(e, camera) {
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
        else if (e.key == "r") {
            camera = {
                x: 0,
                y: 0,
                zoom: 0.1
            };
        }
    };

};