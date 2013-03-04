

window.onload = function() {
var body = document.getElementsByTagName('body')[0]

var roadmode = tags.div({ class: 'button' }, 'Road')
var buildingmode = tags.div({ class: 'button' }, 'Building')



var eng = new engine(body)

body.appendChild(tags.div({ class: 'button-box' }, buildingmode, roadmode))

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
for(var i in vertex) color.push([0.8, 0.7, 0.9])



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

buildingmodel.program = prog




eng.scene = {
	camera: new camera(),
	objects: []
}

function unprojecttoground(e) {

	
	var cam = eng.scene.camera.transform()

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
	return v2
}

buildingmode.onclick = function() {
	window.addEventListener('mousemove', function(e) {
		var o = eng.scene.objects[0]
		o.position = unprojecttoground(e)
	})

	window.addEventListener('click', function(e) {
		var o  = eng.scene.objects[0]
		var n = {}
		for(var i in o) n[i] = o[i]
		eng.scene.objects.push(n)
	})
}

roadmode.onclick = function() {
	window.addEventListener('click', function(e) {
		var p = unprojecttoground(e)

		var p2 = [p[0], p[1]]
		b = new bezier(p2.slice(), p2.slice(), p2.slice())

		window.addEventListener('mousemove', function(e) {
			var p = unprojecttoground(e)
			var p2 = [p[0], p[1]]

			vec2.lerp(b.p[1], b.p[0], p2, 0.5)
			b.p[2] = p2

			var an = new anchor()
			an.model = b.model(eng)
			an.model.program = prog
			eng.scene.objects.pop()
			eng.scene.objects.push(an)
		})
	})
}

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
	var e = new anchor()
	e.position[0] = i*4 - 5
	e.model = buildingmodel

	eng.scene.objects.push(e)
}


eng.draw()

window.addEventListener('mousemove', function(e) {
	var c = eng.scene.camera
	var x = 0;
	var y = 0;
	
	if(e.clientX < 100) x = 1 - e.clientX / 100
	if(e.clientX > window.innerWidth - 100) x = (window.innerWidth-e.clientX) / 100 - 1
	if(e.clientY < 100) y = 1 - e.clientY / 100
	if(e.clientY > window.innerHeight - 100) y = (window.innerHeight-e.clientY) / 100 - 1
	c.velocity[0] = x
	c.velocity[1] = - y

})


}

