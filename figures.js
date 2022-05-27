class Point {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
    }
    pointInCircle(x, y) {
        retrun(x - this.x) ** 2 + (y - this.y) ** 2 < this.r ** 2
    }
};

class Line {
    constructor(point1, point2) {
        this.point1 = point1;
        this.point2 = point2;
    };
}

class Rectangle {
    constructor(gl, x1, y1, x2, y2, shaderProgramRect, shaderProgramPoint, color) {
        this.distToVertex = 10; // изменение при зуме
        this.isSelected = false;

        this.updatePos(x1, y1, x2, y2);
        this.updateRectPos();


        this.shaderProgramRect = shaderProgramRect;
        this.indices = [0, 1, 2, 2, 1, 3];
        if (typeof color !== "undefined") {
            this.color = color;
        } else {
            this.color = [0, 0, 0];
        }

        this._getDefaultTexture();
        this._getDefaultHoverTexture();

        this.texturePos = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
        ];
        if (typeof shaderProgramPoint !== "undefined") {
            this.shaderProgramPoint = shaderProgramPoint;
        };

        this.updateBufferInfo(gl)
    };
    drag(mouseX, mouseY) {

    }
    dragTL(mouseX, mouseY) {
        this.w += this.x - mouseX;
        this.h += this.y - mouseY;
        this.x = mouseX;
        this.y = mouseY;
    };

    dragTR(mouseX, mouseY) {
        this.w = Math.abs(this.x - mouseX);
        this.h += this.y - mouseY;
        this.y = mouseY;
    };

    dragBL(mouseX, mouseY) {
        this.w += this.x - mouseX;
        this.h = Math.abs(this.y - mouseY);
        this.x = mouseX;
    };

    dragBR(mouseX, mouseY) {
        this.w = Math.abs(this.x - mouseX);
        this.h = Math.abs(this.y - mouseY);
    };

    updatePos(x1, y1, x2, y2) {
        if (x1 > x2) {
            let tmp = x2;
            x2 = x1;
            x1 = tmp;
        };
        if (y1 > y2) {
            let tmp = y2;
            y2 = y1;
            y1 = tmp;
        };
        this.x = x1;
        this.y = y1;
        this.w = x2 - x1;
        this.h = y2 - y1;

    };

    updateRectPos() {
        this.rectPos = [
            this.x, this.y, // top-left
            this.x + this.w, this.y, // top-right
            this.x, this.y + this.h, // bottom-left
            this.x + this.w, this.y + this.h  // bottom-right
        ];
    }

    updateBufferInfo(gl) {
        this.bufferInfo = twgl.createBufferInfoFromArrays(gl, {
            a_position: {
                data: this.rectPos,
                numComponents: 2
            },
            a_texCoord: {
                data: this.texturePos,
                numComponents: 2
            },
            indices: {
                data: this.indices,
                numComponents: 2
            }
        });
    };

    updatePoint(gl, x1, y1, x2, y2) {
        this.updatePos(x1, y1, x2, y2);
        this.updateRectPos();
        this.updateBufferInfo(gl)
    };

    pointInVertex(x, y) {
        let elementToChange = document.getElementsByTagName("body")[0];
        // top left
        if (Math.abs(x - this.x) < this.distToVertex / camera.zoom && Math.abs(y - this.y) < this.distToVertex / camera.zoom) {
            elementToChange.style.cursor = "nw-resize";
            console.log('top left');
        }
        // top right 
        else if (Math.abs(x - this.x - this.w) < this.distToVertex / camera.zoom && Math.abs(y - this.y) < this.distToVertex / camera.zoom) {
            elementToChange.style.cursor = "ne-resize";
            console.log('top right');
        }
        // bottom left 
        else if (Math.abs(x - this.x) < this.distToVertex / camera.zoom && Math.abs(y - this.y - this.h) < this.distToVertex / camera.zoom) {
            elementToChange.style.cursor = "sw-resize";
            console.log('bottom left');
        }
        // bottom right 
        else if (Math.abs(x - this.x - this.w) < this.distToVertex / camera.zoom && Math.abs(y - this.y - this.h) < this.distToVertex / camera.zoom) {
            elementToChange.style.cursor = "se-resize";
            console.log('bottom right');
        }
        // no hover
        else {

            elementToChange.style.cursor = "default";
        }
    }

    pointInRect(x, y) {
        if (x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h) {
            this.isSelected = true;
            return true
        } else {
            this.isSelected = false;
            return false
        };
    };

    _getDefaultHoverTexture() {
        this.hoverTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.hoverTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(this.color.concat([127])));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    _getDefaultTexture() {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(this.color.concat([63])));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    resetTexture(color) {
        this.color = color;
        this._getDefaultHoverTexture();
        this._getDefaultTexture();
    };

    draw(gl, uniforms) {
        gl.useProgram(this.shaderProgramRect.program);
        twgl.setBuffersAndAttributes(gl, this.shaderProgramRect, this.bufferInfo);
        twgl.setUniforms(this.shaderProgramRect, uniforms);
        twgl.drawBufferInfo(gl, this.bufferInfo, gl.TRIANGLES);
    };

};

function getTileFromImage(gl, context, sizeX, sizeY, posTexX, posTexY, posDrawX, posDrawY, shader) {
    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, context.getImageData(posTexX, posTexY, sizeX, sizeY));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    let rectPos = [
        posDrawX, posDrawY,
        posDrawX + sizeX, posDrawY,
        posDrawX, posDrawY + sizeY,
        posDrawX, posDrawY + sizeY,
        posDrawX + sizeX, posDrawY,
        posDrawX + sizeX, posDrawY + sizeY
    ];
    let texPos = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
    ];
    return {
        shaderProgram: shader,
        texture: tex,
        bufferInfo: twgl.createBufferInfoFromArrays(gl, {
            a_position: {
                data: rectPos,
                numComponents: 2
            },
            a_texCoord: {
                data: texPos,
                numComponents: 2
            }
        })
    };
};


function getBBoxFromXYXY(gl, x1, y1, x2, y2, color, shader) {
    let tex = gl.createTexture();
    let w = x2 - x1;
    let h = y2 - y1;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(color));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    let rectPos = [
        x1, y1,
        x1 + w, y1,
        x1, y1 + h,
        x1, y1 + h,
        x1 + w, y1,
        x1 + w, y1 + h
    ];
    let texPos = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
    ];
    return {
        rectPos: rectPos,
        texPos: texPos,
        shaderProgram: shader,
        texture: tex,
        bufferInfo: twgl.createBufferInfoFromArrays(gl, {
            a_position: {
                data: rectPos,
                numComponents: 2
            },
            a_texCoord: {
                data: texPos,
                numComponents: 2
            }
        })
    };
};