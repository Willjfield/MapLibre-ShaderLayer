import earcut from "earcut";
import maplibregl from 'maplibre-gl';
import proj4 from 'proj4';
//import { loadTexture } from "./utils";
export default class MapLibreShaderLayer {
    constructor(map, id, fromLayers, opts) {
        //map, id, fromLayers, fragmentSource, vertexSource;
        this.opts = opts || {};

        this.id = id;
        this.map = map;
        this.fromLayers = fromLayers;

        this.type = 'custom';
        this.keys = [];

        this.positions = [];

        this.glDrawType = 'TRIANGLES';

        this.matrix;

        // create GLSL source for vertex shader
        const defaultVertexSource = `#version 300 es
    
            uniform mat4 u_matrix;
            in vec2 a_pos;
            void main() {
                gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
            }`;

        // create GLSL source for fragment shader
        const defaultFragmentSource = `#version 300 es
    
            out highp vec4 fragColor;
            void main() {
                fragColor = vec4(1.0, 0.0, 0.0, 1.0);
            }`;

        this.positionLength = 0;

        this.fragmentSource = this.opts.fragmentSource || defaultFragmentSource;
        this.vertexSource = this.opts.vertexSource || defaultVertexSource;
        this.animate = this.opts.animate || null;
        this.onRenderCallback = this.opts.onRenderCallback || null;
        this.pointOptions = this.opts.pointOptions || {
            'anchor': 'center',
            'width': 100,
            'height': 100
        };

        this.addedBufferNames = this.opts.addedBufferNames || [];
        this.texcoordAttributeLocation = {};
        this.normCoordAttributeLocation = {};
        this.texture = {};
        this.addedBuffers = {};
        this.attrPositions = {};

        this.program;
        this.context;

        this.imagePath = this.opts.imagePath || null;
        this.normalImagePath = this.opts.normalImagePath || null;
        this.uniforms = this.opts.uniforms || [];
    }

    // method called when the layer is added to the map
    // Search for StyleImageInterface in https://maplibre.org/maplibre-gl-js/docs/API/
    onAdd(map, gl) {
        this.context = gl;

        // create a vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, this.vertexSource);
        gl.compileShader(vertexShader);
        console.log(gl.getShaderInfoLog(vertexShader))

        // create a fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, this.fragmentSource);
        gl.compileShader(fragmentShader);
        console.log(gl.getShaderInfoLog(fragmentShader))

        // link the two shaders into a WebGL program
        this.program = gl.createProgram();


        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        gl.useProgram(this.program);

        if (this.uniforms && this.uniforms.length > 0) {
            for (let u = 0; u < this.uniforms.length; u++) {
                this.setUniform(this.uniforms[u]);
            }
        }

        this.aPos = gl.getAttribLocation(this.program, 'a_pos');
        this.texcoordAttributeLocation = gl.getAttribLocation(this.program, "a_texcoord");
        this.normCoordAttributeLocation = gl.getAttribLocation(this.program, "a_normcoord");
        this.buffer = gl.createBuffer();

        if (this.addedBufferNames.length > 0) {
            this.addBuffers();
        }



        this.calculateVertices(gl);

        if (this.animate) {
            this.animate(this);
        }

        if (this.imagePath) {
            this.image = new Image();
            this.image.src = this.imagePath;
            const self = this;
            this.image.addEventListener('load', function () {
                if (self.map.triggerRepaint) {
                    self.map.triggerRepaint();
                }
            });
        }

        if (this.normalImagePath) {
            this.normalImage = new Image();
            this.normalImage.src = this.normalImagePath;

            this.normalImage.addEventListener('load', function () {
                if (self.map.triggerRepaint) {
                    self.map.triggerRepaint();
                }
            });
        }


    }

    addBuffers() {
        const gl = this.context;
        this.addedBufferNames.forEach((b) => {
            this.attrPositions[b] = gl.getAttribLocation(this.program, b);
            this.addedBuffers[b] = gl.createBuffer();
        })
    }

    setBuffer(_bufferName, data, size, type, normalized, stride, offset) {
        const gl = this.context;
        if (this.attrPositions[_bufferName] > -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.addedBuffers[_bufferName]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(this.attrPositions[_bufferName]);
            gl.vertexAttribPointer(this.attrPositions[_bufferName], size, type, normalized, stride, offset);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.addedBuffers[_bufferName]);
        }
    }

    // method fired on each animation frame
    render(gl, matrix) {
        //console.log('RENDER')
        this.matrix = matrix;

        this.calculateVertices(gl);

        gl.useProgram(this.program);

        this.updateResolution();
        this.updateMapBBox();

        if (this.onRenderCallback) {
            this.onRenderCallback(this.map, gl, this.program);
        }

        gl.uniformMatrix4fv(
            gl.getUniformLocation(this.program, 'u_matrix'),
            false,
            matrix
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);

        if (this.image) {
            this.establishTexture(gl, this.image, 'texcoordAttributeLocation', 0);
        }

        if (this.normalImage) {
            this.establishTexture(gl, this.normalImage, 'normCoordAttributeLocation', 1);
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        var textureLocation = gl.getUniformLocation(this.program, "u_texture");
        gl.uniform1i(textureLocation, 0);

        var normalTextureLocation = gl.getUniformLocation(this.program, "u_normal");
        gl.uniform1i(normalTextureLocation, 1);

        gl.drawArrays(gl[this.glDrawType], 0, this.positionLength / 2);
    }

    createHash(_str) {
        var hash = 0,
            i, chr;
        if (_str.length === 0) return hash;
        for (i = 0; i < _str.length; i++) {
            chr = _str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;

    }

    getFeatureHash(f) {
        return this.createHash(`${f.id}${f._vectorTileFeature._x}${f._vectorTileFeature._y}${f._vectorTileFeature._z}`)//${JSON.stringify(f.geometry.coordinates)}
    }

    polyCoordsToPositions(_coords) {
        var data = earcut.flatten(_coords);

        var triangles = earcut(data.vertices, data.holes, 2);

        for (var i = 0; i < triangles.length; i++) {
            if (typeof data.vertices[triangles[i] * 2] === 'number'
                && typeof data.vertices[triangles[i] * 2 + 1] === 'number') {
                const mercPos = maplibregl.MercatorCoordinate.fromLngLat({
                    lng: data.vertices[triangles[i] * 2],
                    lat: data.vertices[triangles[i] * 2 + 1]
                });
                this.positions.push(mercPos.x, mercPos.y);
            } else {
                console.error('Error in coordinatesToPositions', data.vertices[triangles[i] * 2], data.vertices[triangles[i] * 2 + 1]);
            }
        }
    }

    lineCoordsToPositions(_coords) {
        for (var i = 0; i < _coords.length; i++) {
            const mercPos = maplibregl.MercatorCoordinate.fromLngLat({
                lng: _coords[i][0],
                lat: _coords[i][1]
            });
            this.positions.push(mercPos.x, mercPos.y);
        }
    }
    pointCoordsToPositions(_coords) {
        const ratio = this.map.getContainer().offsetWidth / this.map.getContainer().offsetHeight;
        const normWidth = (this.pointOptions.width * ratio * window.devicePixelRatio) / this.map.getContainer().offsetWidth;
        const normHeight = (this.pointOptions.height * ratio) / this.map.getContainer().offsetWidth * window.devicePixelRatio;

        for (var i = 0; i < _coords.length; i++) {
            const LL = maplibregl.MercatorCoordinate.fromLngLat({
                lng: _coords[0] - normWidth / 2,
                lat: _coords[1] - normHeight / 2
            });
            const UL = maplibregl.MercatorCoordinate.fromLngLat({
                lng: _coords[0] - normWidth / 2,
                lat: _coords[1] + normHeight / 2
            })
            const UR = maplibregl.MercatorCoordinate.fromLngLat({
                lng: _coords[0] + normWidth / 2,
                lat: _coords[1] + normHeight / 2
            })
            const LR = maplibregl.MercatorCoordinate.fromLngLat({
                lng: _coords[0] + normWidth / 2,
                lat: _coords[1] - normHeight / 2
            });

            this.positions.push(LL.x, LL.y);
            this.positions.push(UL.x, UL.y);
            this.positions.push(UR.x, UR.y);

            this.positions.push(UR.x, UR.y);
            this.positions.push(LR.x, LR.y);
            this.positions.push(LL.x, LL.y);
        }
    }

    calculateVertices(gl) {
        //console.log('calculateVertices')
        this.positions = [];
        this.keys = [];
        //Reset cache. Definitely a smarter way to do this. Removing first item in instead of resetting the whole thing at once?
        // console.log(this.keys.length)
        // const MAX_BUFFER_SIZE = 500;
        // if (this.keys.length > MAX_BUFFER_SIZE) {
        //     this.positions = [];
        //     this.keys = [];
        // }
        this.features = this.map.queryRenderedFeatures({ layers: this.fromLayers });
        const _ids = this.features.map(f => this.getFeatureHash(f));

        const polygons = this.features.filter(f => f.geometry.type === 'Polygon'
            || f.geometry.type === 'MultiPolygon'
            || f.geometry.type === 'Point'
            || f.geometry.type === 'MultiPoint'
            || f.geometry.type === 'LineString'
        );

        for (var p = 0; p < polygons.length; p++) {
            const hash = _ids[p];
            //if (this.keys.indexOf(hash) === -1) {
            //this.keys.push(hash);
            //Or not
            // if(true) {
            switch (polygons[p].geometry.type) {
                case 'Polygon':
                    this.polyCoordsToPositions(polygons[p].geometry.coordinates);
                    break;
                case 'MultiPolygon':
                    const multiPolyCoords = polygons[p].geometry.coordinates;
                    multiPolyCoords.forEach((solocoords, i) => {
                        this.polyCoordsToPositions(solocoords);
                    });
                    break;
                case 'Point':
                    this.pointCoordsToPositions(polygons[p].geometry.coordinates);
                    break;
                case 'MultiPoint':
                    const multiPointCoords = polygons[p].geometry.coordinates;
                    multiPointCoords.forEach((solocoords, i) => {
                        this.pointCoordsToPositions(solocoords);
                    })
                    break;
                case 'LineString':
                    this.glDrawType = 'LINES';
                    this.lineCoordsToPositions(polygons[p].geometry.coordinates);
                    break;
                default:
                    console.warn(polygons[p].geometry.type, ' not supported');
                    break;
            }
            // }
        }

        this.positionLength = this.positions.length;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.positions),
            gl.STATIC_DRAW,
            0
        );

    }

    updateMapBBox() {

        const gl = this.context;
        const prog = this.program;
        gl.useProgram(prog);
        //if (!prog) return;
        const u_bboxLocation = gl.getUniformLocation(prog, 'u_bbox');

        const map = this.map;

        const sw4326 = map.unproject([0, map.getContainer().offsetHeight]);
        const ne4326 = map.unproject([map.getContainer().offsetWidth, 0]);
        const sw3857 = proj4('EPSG:4326', 'EPSG:3857', [sw4326.lng, sw4326.lat]);
        const ne3857 = proj4('EPSG:4326', 'EPSG:3857', [ne4326.lng, ne4326.lat]);
        //console.log([sw3857[0], sw3857[1], ne3857[0], ne3857[1]])
        gl.uniform4fv(u_bboxLocation, [sw3857[0], sw3857[1], ne3857[0], ne3857[1]]);
    }

    setUniform(uniformObj) {
        let gl = this.context;
        gl.useProgram(this.program);

        const _location = gl.getUniformLocation(this.program, uniformObj.name);
        switch (uniformObj.type) {
            case 'int':
                gl.uniform1i(_location, uniformObj.value);
                break;
            case 'float':
                gl.uniform1f(_location, uniformObj.value);
                break;
            case 'vec2':
                gl.uniform2fv(_location, uniformObj.value);
                break;
            case 'vec3':
                gl.uniform3fv(_location, uniformObj.value);
                break;
            case 'vec4':
                gl.uniform4fv(_location, uniformObj.value);
                break;
            default: break;
        }
    }

    updateResolution() {
        const gl = this.context;
        const prog = this.program;
        // if (!prog) return;
        gl.useProgram(prog);
        let u_resolutionLocation = gl.getUniformLocation(prog, 'u_resolution');
        const res = [this.map.getContainer().offsetWidth, this.map.getContainer().offsetHeight];

        gl.uniform2fv(u_resolutionLocation, res);
        let u_pixelRatio = gl.getUniformLocation(prog, 'u_devicePixelRatio');
        gl.uniform1f(u_pixelRatio, window.devicePixelRatio);
        this.map.triggerRepaint();
    }

    establishTexture(gl, img, location, tunit) {

        let texcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        //
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.positions),
            gl.STATIC_DRAW,
            0
        );

        gl.enableVertexAttribArray(this[location]);

        // Tell the attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floating point values
        var normalize = true;  // convert from 0-255 to 0.0-1.0
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next color
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            this[location], size, type, normalize, stride, offset);

        // Create a texture.
        this.texture[location] = gl.createTexture();
        // use texture unit 0
        gl.activeTexture(gl.TEXTURE0 + tunit);

        // bind to the TEXTURE_2D bind point of texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, this.texture[location]);

        // Fill the texture with a 1x1 blue pixel.
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        //     new Uint8Array([0, 0, 255, 255]));
        gl.bindTexture(gl.TEXTURE_2D, this.texture[location]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

}



