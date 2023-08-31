import earcut from "earcut";
import maplibregl from 'maplibre-gl';
export default class MapLibreShaderLayer {
    constructor(map, id, fromLayers, fragmentSource, vertexSource) {

        this.id = id;
        this.map = map;
        this.fromLayers = fromLayers;

        this.type = 'custom';

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

        gl.drawArrays(gl.TRIANGLES, 0, this.positionLength/2);
    }

    calculateVertices(gl) {
        this.features = this.map.queryRenderedFeatures({ layers: this.fromLayers });
        const polygons = this.features.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
        const positions = [];

        for (var p = 0; p < polygons.length; p++) {
            var data = earcut.flatten(polygons[p].geometry.coordinates);

            var triangles = earcut(data.vertices, data.holes, data.dimensions);


            if (polygons[p].geometry.type === 'Polygon') {
                for (var i = 0; i < triangles.length; i++) {
                    if (data.vertices[triangles[i] * 2] && data.vertices[triangles[i] * 2 + 1]) {
                        const mercPos = maplibregl.MercatorCoordinate.fromLngLat({
                            lng: data.vertices[triangles[i] * 2],
                            lat: data.vertices[triangles[i] * 2 + 1]
                        });
                        positions.push(mercPos.x, mercPos.y);
                    }
                }
            } else if (polygons[p].geometry.type === 'MultiPolygon') {
                for (var i = 0; i < triangles.length; i++) {
                    if (data.vertices[triangles[i]] 
                        && data.vertices[triangles[i]][0] 
                        && data.vertices[triangles[i]][1]) {
                        const mercPos = maplibregl.MercatorCoordinate.fromLngLat({
                            lng: data.vertices[triangles[i]][0],
                            lat: data.vertices[triangles[i]][1]
                        });
                        positions.push(mercPos.x, mercPos.y);
                    }
                }
            }


        }
        this.positionLength = positions.length;

        // create and initialize a WebGLBuffer to store vertex and color data
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW,
            0
        );
    }
}

// add the custom style layer to the map
// map.on('load', () => {
//     map.addLayer(highlightLayer, 'crimea-fill');
// });