function camera() {
	this.velocity = [0, 0]
	this.position = [0, 0]
	this.distance = -20
	this.projection = mat4.create()
	this.rotation = [-1, 0, 0]

	mat4.perspective(this.projection, 45, window.innerWidth/window.innerHeight, 0.1, 1000)
}

camera.prototype = {
	update: function(elapsed) {
		var v = vec2.clone(this.velocity)
		vec2.scale(v, v, - this.distance * elapsed / 1000)
		var mat = mat2.create()
		mat2.identity(mat)
		mat2.rotate(mat, mat, this.rotation[2])
		vec2.transformMat2(v, v, mat)
		vec2.add(this.position, this.position, v)
	},
	transform: function() {
		var view = mat4.create()
		mat4.identity(view)

		mat4.translate(view, view, [0, 0, this.distance])
		mat4.rotateX(view, view, this.rotation[0])
		mat4.rotateZ(view, view, this.rotation[2])
		mat4.translate(view, view, [this.position[0], this.position[1], 0])
		return view
	}

}
