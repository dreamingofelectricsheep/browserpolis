

function engine(parent) {
	this.canvas = document.createElement('canvas')
	this.canvas.width = window.innerWidth
	this.canvas.height = window.innerHeight

	this.gl = this.canvas.getContext('experimental-webgl')
	if(this.gl == undefined)
		alert("No webgl!") 

	this.gl.enable(this.gl.DEPTH_TEST)
	this.gl.clearColor(0.0, 0.0, 0.0, 1.0)

	parent.appendChild(this.canvas)
}

function cameratransform(cam) {
	var view = mat4.create()
	mat4.identity(view)

	mat4.translate(view, view, [0, 0, cam.distance])
	mat4.rotateX(view, view, cam.rotation[0])
	mat4.rotateZ(view, view, cam.rotation[2])
	return view
}



engine.prototype = {
	draw: function() {
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

		for(var i in this.scene.objects) {
			var o = this.scene.objects[i]
			var prog = o.model.program

			var view = cameratransform(this.scene.camera)

			var model = mat4.create()
			mat4.identity(model)
			mat4.translate(model, model, o.position)

			prog.uniform.model.set(model)
			prog.uniform.view.set(view)
			prog.uniform.projection.set(this.scene.camera.projection)

			o.model.draw(prog.attrib.position, prog.attrib.color, prog.attrib.normal)
		}


		var that = this
		requestAnimationFrame(function() { that.draw() })
	},
	vertex_shader: function(plaintext) {
		return new shader(this.gl, this.gl.VERTEX_SHADER, plaintext)
	},
	fragment_shader: function(plaintext) {
		return new shader(this.gl, this.gl.FRAGMENT_SHADER, plaintext)
	},
	program: function(vertex, fragment) {
		return new program(this.gl, vertex, fragment)
	},
	buffer: function() {
		return new buffer(this.gl)
	}
}

function anchor() {
	this.position = [0, 0, 0]
	this.rotation = [0, 0, 0]
}

function shader(gl, type, plaintext) {
	this.shader = gl.createShader(type)
	this.type = type
	gl.shaderSource(this.shader, plaintext)
	gl.compileShader(this.shader)

	if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(this.shader))
	}
}

function program(gl, vertex, fragment) {
	this.program = gl.createProgram()
	gl.attachShader(this.program, vertex.shader)
	gl.attachShader(this.program, fragment.shader)
	gl.linkProgram(this.program)

	if(!gl.getProgramParameter(this.program, gl.LINK_STATUS))
		alert("Error during shader init.")

	this.uniform = {}
	this.attrib = {}

	gl.useProgram(this.program)

	var t, i = 0
	while(t = gl.getActiveUniform(this.program, i++)) {
		this.uniform[t.name] = {
			uniform: gl.getUniformLocation(this.program, t.name),
			set: function(mat) { gl.uniformMatrix4fv(this.uniform, false, mat) }
		}
	}

	i = 0
	while(t = gl.getActiveAttrib(this.program, i++)) {
		this.attrib[t.name] = {
			attrib: gl.getAttribLocation(this.program, t.name)
		}
		gl.enableVertexAttribArray(this.attrib[t.name].attrib)
	}
}

function buffer(gl, data) {
	this.buffer = gl.createBuffer()
	this.gl = gl
	this.items = 0
	this.subitems = 0

}

buffer.prototype = {
	bind: function () {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
	},
	data: function(d) {
		this.bind()
		this.items = d.length
		this.subitems = d[0].length
		var arr = []
		for(var i in d) arr = arr.concat(d[i])
		arr = new Float32Array(arr)

		this.gl.bufferData(this.gl.ARRAY_BUFFER, arr, this.gl.STATIC_DRAW)
	},

}

function model() { }
model.prototype = {
	draw: function(vertex, color) {
		var gl = this.vertex.gl
		var list = ['vertex', 'color', 'normal']
		for(var i in list) {
			this[list[i]].bind()
			gl.vertexAttribPointer(arguments[i].attrib, this[list[i]].subitems, gl.FLOAT, false, 0, 0)
		}

		gl.drawArrays(gl.TRIANGLES, 0, this.vertex.items)
	}

}
