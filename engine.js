

function engine(parent) {
	this.canvas = document.createElement('canvas')
	this.canvas.width = window.innerWidth
	this.canvas.height = window.innerHeight

	this.gl = this.canvas.getContext('experimental-webgl')
	if(this.gl == undefined) 
		parent.appendChild(tags.div({ class: 'error' }, "Looks like your browser does not support WebGL. Sucks to be you."))

	this.gl.enable(this.gl.DEPTH_TEST)
	this.gl.clearColor(0.8, 0.9, 0.7, 1.0)

	parent.appendChild(this.canvas)
}



engine.prototype =
{
	draw: function(last)
	{
		var x = window.innerWidth,
			y = window.innerHeight
		
		this.canvas.width = x
		this.canvas.height = y

		this.scene.camera.aspect = x/y
		
		var time = new Date().getTime()
		if(last == undefined) last = time
		this.scene.camera.update(time - last)

		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

		for(var i in this.scene.objects)
		{
			var o = this.scene.objects[i]
			if(o.model == undefined) continue
			var prog = o.model.program

			var view = this.scene.camera.transform()

			var model = mat4.create()
			mat4.identity(model)
			mat4.translate(model, model, o.position)
			mat4.rotateZ(model, model, o.rotation[2])

			prog.uniform.model.set(model)
			prog.uniform.view.set(view)
			prog.uniform.projection.set(this.scene.camera.projection)

			o.model.draw({
				vertex: prog.attrib.position, 
				color: prog.attrib.color, 
				normal: prog.attrib.normal })
		}


		var that = this
		var callback = window.requestAnimationFrame || window.mozRequestAnimationFrame
		callback(function() { that.draw(time) })
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
	buffer: function(content, data) {
		return new buffer(this.gl, data)
	},
	model: function(buffers) {
		return new model(this.gl, buffers)
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

	if(data != undefined)
		this.data(data)
}

buffer.prototype = {
	bind: function () {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
	},
	data: function(d) {
		this.bind()
		this.items = d.length
		
		if(d.length > 0)
			this.subitems = d[0].length

		var arr = []

		for(var i in d)
		{
			for(var j = 0; j < d[i].length; j++)
			{
				arr.push(d[i][j])
			}
		}

		arr = new Float32Array(arr)

		this.gl.bufferData(this.gl.ARRAY_BUFFER, arr, this.gl.STATIC_DRAW)
	}

}

function model(gl, buffers) { 
	this.gl = gl
	this.buffers = {}

	for(var i in buffers)
		this.buffers[i] = new buffer(gl, buffers[i])
}

model.prototype = {
	draw: function(attr) {
		var gl = this.gl
		for(var i in this.buffers) {
			this.buffers[i].bind()
			gl.vertexAttribPointer(attr[i].attrib, this.buffers[i].subitems, gl.FLOAT, false, 0, 0)
		}

		gl.drawArrays(gl.TRIANGLES, 0, this.buffers.vertex.items)
	}

}
