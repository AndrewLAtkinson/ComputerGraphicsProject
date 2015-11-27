function main() {
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	var gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}
  
	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE_SUN, FSHADER_SOURCE_SUN)) {
		console.log('Failed to initialize shaders.');
	}
  
	// Set the vertex coordinates and the color.
	var n = initVertexBuffers(gl);
	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}
	
	// Set clear color and enable the depth test
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	// Get the storage locations of uniform variables
	var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  	var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  	var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  	var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  	var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  	var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  	
  	//Error if any of the shaders failed to initialize
  	if (!u_ModelMatrix || !u_MvpMatrix || !u_NormalMatrix || !u_LightColor || !u_LightPosition　|| !u_AmbientLight) { 
  	    console.log('Failed to get the storage location');
  	    return;
  	}
  	
    // Set the light color (white)
    gl.uniform3f(u_LightColor, 0.8, 0.8, 0.8);
    // Set the light direction (in the world coordinate)
    gl.uniform3f(u_LightPosition, 5.0, 8.0, 7.0);
    // Set the ambient light
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);  	
	
	// Various matrices
	var modelMatrix = new Matrix4(); // Model Matrix
	var mvpMatrix = new Matrix4(); // Model View Projection Matrix
	var normalMatrix = new Matrix4(); // Transformation matrix for normals
	
	// Calculate the model matrix
	modelMatrix.setRotate(90, 0, 1, 0); // Rotate around the y-axis
	
	// Calculate the View Projection Matrix
	mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
	mvpMatrix.lookAt(0, 0, 6, 0, 0, 0, 0, 1, 0);
	mvpMatrix.multiply(modelMatrix);
	
	// Calculate the matrix to transform the normal based on the model matrix
	normalMatrix.setInverseOf(modelMatrix);
	normalMatrix.transpose();
	
	// Pass the model matrix to u_ModelMatrix
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	
	// Pass the model view projection matrix to u_MvpMatrix
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
	
	// Pass the transformation matrix for normals to u_NormalMatrix
	gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
	
	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// Draw the sphere(Note that the 3rd argument is the gl.UNSIGNED_SHORT)
	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
}

// Code to create a sphere
function initVertexBuffers(gl) {
	// Increase to make spheres more smooth
	var SPHERE_DIV = 13;
	
	var i, ai, si, ci;
	var j, aj, sj, cj;
	var p1, p2;
	
	var positions = [];
	var indices = [];
	
	// Generate coordinates
	for (j = 0; j <= SPHERE_DIV; j++) {
		aj = j * Math.PI / SPHERE_DIV;
		sj = Math.sin(aj);
		cj = Math.cos(aj);
		for (i = 0; i <= SPHERE_DIV; i++) {
			ai = i * 2 * Math.PI / SPHERE_DIV;
			si = Math.sin(ai);
			ci = Math.cos(ai);
			
			positions.push(si * sj); // X
			positions.push(cj); // Y
			positions.push(ci * sj); // Z
		}
	}
	
	// Generate indices
	for (j = 0; j < SPHERE_DIV; j++) {
		for (i = 0; i < SPHERE_DIV; i++) {
			p1 = j * (SPHERE_DIV + 1) + i;
			p2 = p1 + (SPHERE_DIV + 1);
			
			indices.push(p1);
			indices.push(p2);
			indices.push(p1 + 1);
			
			indices.push(p1 + 1);
			indices.push(p2);
			indices.push(p2 + 1);
		}
	}
	
	// Write the vertex property to buffers (coordinates and normals)
	// Same data can be used for vertex and normal
	// In order to make it intelligible, another buffer is prepared separately
	if (!initArrayBuffer(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3)) return -1;
	if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(positions), gl.FLOAT, 3))  return -1;
	
	// Unbind the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	// Write the indices to the buffer object
	var indexBuffer = gl.createBuffer();
	
	if (!indexBuffer) {
		console.log('Failed to create the buffer object');
		return -1;
	}
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	
	return indices.length;
}

function initArrayBuffer(gl, attribute, data, type, num) {
	// Create a buffer object
	var buffer = gl.createBuffer();
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return false;
	}
	
	// Write data into the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	
	// Assign the buffer object to the attribute variable
	var a_attribute = gl.getAttribLocation(gl.program, attribute);
	if (a_attribute < 0) {
		console.log('Failed to get the storage location of ' + attribute);
		return false;
	}
	
	gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
	
	// Enable the assignment of the buffer object to the attribute variable
	gl.enableVertexAttribArray(a_attribute);
	
	return true;
}

