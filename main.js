

window.onload = function() {
var body = document.getElementsByTagName('body')[0]

var eng = new engine(body)

var vertext = document.getElementById('shader-vs').innerHTML
var fragtext = document.getElementById('shader-fs').innerHTML

var vs = eng.vertex_shader(vertext)
var fs = eng.fragment_shader(fragtext)

var prog = eng.program(vs, fs)


var vertex = [
	[-1, -1, 0],
	[1, -1, 0],
	[1, -1, 5],

	[-1, -1, 0],
	[-1, -1, 5],
	[1, -1, 5],


	
	[-1, 1, 0],
	[-1, -1, 0],
	[-1, -1, 5],

	[-1, -1, 5],
	[-1, 1, 5],
	[-1, 1, 0],


	
	[1, 1, 0],
	[1, 1, 5],
	[-1, 1, 5],

	[-1, 1, 0],
	[-1, 1, 5],
	[1, 1, 0],



	[1, 1, 0],
	[1, 1, 5],
	[1, -1, 5],

	[1, -1, 0],
	[1, -1, 5],
	[1, 1, 0],



	[1, 1, 5],
	[1, -1, 5],
	[-1, 1, 5],

	[1, -1, 5],
	[-1, 1, 5],
	[-1, -1, 5]
]
var normal = [
	[0, -1, 0],
	[0, -1, 0],
	[0, -1, 0],
	[0, -1, 0],
	[0, -1, 0],
	[0, -1, 0],

	[-1, 0, 0],
	[-1, 0, 0],
	[-1, 0, 0],
	[-1, 0, 0],
	[-1, 0, 0],
	[-1, 0, 0],

	[0, 1, 0],
	[0, 1, 0],
	[0, 1, 0],
	[0, 1, 0],
	[0, 1, 0],
	[0, 1, 0],

	[1, 0, 0],
	[1, 0, 0],
	[1, 0, 0],
	[1, 0, 0],
	[1, 0, 0],
	[1, 0, 0],

	[0, 0, 1],
	[0, 0, 1],
	[0, 0, 1],
	[0, 0, 1],
	[0, 0, 1],
	[0, 0, 1]
]

var color = []
for(var i in vertex) color.push([0.0, 1.0, 1.0])



var building= eng.buffer()
building.data(vertex)
var colorsbuf = eng.buffer()
colorsbuf.data(color)
var normalbuf = eng.buffer()
normalbuf.data(normal)

var buildingmodel = new model()
buildingmodel.color = colorsbuf
buildingmodel.vertex = building
buildingmodel.normal= normalbuf


var perspective = mat4.create()
mat4.perspective(perspective, 45, window.innerWidth/window.innerHeight, 0.1, 1000)


eng.scene = {
	camera: {
		distance: -20,
		projection: perspective,
		rotation: [-1, 0, 0]
	},
	objects: []
}

window.addEventListener('mousemove', function(e) {
	var o = eng.scene.objects[0]

	
	var cam = cameratransform(eng.scene.camera)

	var cx = -(e.clientX/window.innerWidth-0.5)*2
	var cy =  -(e.clientY/window.innerHeight-0.5)*2

	var aspect = window.innerWidth / window.innerHeight

	var mat = mat4.create()
	var conv = 45/90
	mat4.identity(mat)
	mat4.rotateX(mat, mat, cy*conv)
	mat4.rotateY(mat, mat, cx*conv*aspect*0.8)
	
	
	
	var n = [0, 0, 0]
	var v = [0, 0, -1]
	mat4.invert(cam, cam)

	vec3.transformMat4(v, v, mat)
	vec3.transformMat4(v, v, cam)

	vec3.transformMat4(n, n, cam)


	var v2 = vec3.create()
	vec3.sub(v2, v, n)

	var x = -n[2] / v2[2]
	vec3.scale(v2, v2, x)
	vec3.add(v2, v2, n)
	o.position = v2
})

window.addEventListener('click', function(e) {
	var o  = eng.scene.objects[0]
	var n = {}
	for(var i in o) n[i] = o[i]
	eng.scene.objects.push(n)
})

window.onmousedown = function(e) {
	var x = e.clientX

	window.onmousemove = function(e) {
		eng.scene.camera.rotation[2] += (e.clientX - x) / 500
		x = e.clientX
	}

	window.onmouseup = function(e) {
		window.onmousemove = undefined
		window.onmouseup = undefined
	}
}

window.onmousewheel = function(e) {
	eng.scene.camera.distance = -Math.exp(Math.log(-eng.scene.camera.distance) - e.wheelDelta / 1000)
}

for(var i = 0; i < 10; i++) {
	var e = new entity()
	e.position[0] = i*4 - 5
	e.model = buildingmodel
	e.program = prog

	eng.scene.objects.push(e)
}

eng.draw()

}

