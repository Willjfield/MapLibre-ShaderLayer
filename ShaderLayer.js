import earcut from "earcut";
import maplibregl from 'maplibre-gl';


export default class MapLibreShaderLayer {
    constructor(map, id, fromLayers, fragmentSource, vertexSource) {

        this.id = id;
        this.map = map;
        this.fromLayers = fromLayers;

        this.type = 'custom';
        this.keys = [];

        this.positions = [];

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

        this.fragmentSource = fragmentSource || defaultFragmentSource;
        this.vertexSource = vertexSource || defaultVertexSource;

        this.positionLength = 0;


    }



    // method called when the layer is added to the map
    // Search for StyleImageInterface in https://maplibre.org/maplibre-gl-js/docs/API/
    onAdd(map, gl) {

        // create a vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, this.vertexSource);
        gl.compileShader(vertexShader);

        // create a fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, this.fragmentSource);
        gl.compileShader(fragmentShader);

        // link the two shaders into a WebGL program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        this.aPos = gl.getAttribLocation(this.program, 'a_pos');
        this.buffer = gl.createBuffer();

        this.calculateVertices(gl);
    }


    // method fired on each animation frame
    render(gl, matrix) {

        this.calculateVertices(gl);

        gl.useProgram(this.program);
        gl.uniformMatrix4fv(
            gl.getUniformLocation(this.program, 'u_matrix'),
            false,
            matrix
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.drawArrays(gl.TRIANGLES, 0, this.positionLength / 2);
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

        return this.createHash(`${f.layer.id}-${f.source}-${f.sourceLayer}-${JSON.stringify(f.properties)}-${JSON.stringify(f.geometry.coordinates)}-${f._vectorTileFeature._x}-${f._vectorTileFeature._y}-${f._vectorTileFeature._z}`)
    }

    getSlayerFeatures() {
        return this.keys;
    }

    calculateVertices(gl) {
        this.features = this.map.queryRenderedFeatures({ layers: this.fromLayers });

        const strs = this.features.map(f => this.getFeatureHash(f));

        const polygons = this.features.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
        //this.addFeature(polygons[0].geometry.coordinates)
        for (var p = 0; p < polygons.length; p++) {
            const hash = this.getFeatureHash(polygons[p]);

            if (true) {

                if (polygons[p].geometry.type === 'Polygon') {

                    var data = earcut.flatten(polygons[p].geometry.coordinates);

                    var triangles = earcut(data.vertices, data.holes, data.dimensions);

                    for (var i = 0; i < triangles.length; i++) {
                        if (data.vertices[triangles[i] * 2] && data.vertices[triangles[i] * 2 + 1]) {
                            const mercPos = maplibregl.MercatorCoordinate.fromLngLat({
                                lng: data.vertices[triangles[i] * 2],
                                lat: data.vertices[triangles[i] * 2 + 1]
                            });
                            this.positions.push(mercPos.x, mercPos.y);
                        }
                    }
                } else if (polygons[p].geometry.type === 'MultiPolygon') {
                    const multiCoords = polygons[p].geometry.coordinates;
                    multiCoords.forEach((solocoords, i) => {

                        var data = earcut.flatten(solocoords);
                        var triangles = earcut(data.vertices, data.holes, data.dimensions);
                        for (var i = 0; i < triangles.length; i++) {
                            if (data.vertices[triangles[i] * 2] && data.vertices[triangles[i] * 2 + 1]) {
                                const mercPos = maplibregl.MercatorCoordinate.fromLngLat({
                                    lng: data.vertices[triangles[i] * 2],
                                    lat: data.vertices[triangles[i] * 2 + 1]
                                });
                                this.positions.push(mercPos.x, mercPos.y);
                            }
                        }
                    })

                } else {
                    console.log(polygons[p].geometry.type)
                }

            }
        }

        this.keys = this.keys.concat(strs.filter((f, i) => this.keys.indexOf(f) === -1));
        this.positionLength = this.positions.length;

        // create and initialize a WebGLBuffer to store vertex and color data
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.positions),
            gl.STATIC_DRAW,
            0
        );

        this.positions = [];
    }




}



