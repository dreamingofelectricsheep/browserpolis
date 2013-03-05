

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

	
	var camera = eng.scene.camera
	var cam = camera.transform()

	var x = (e.clientX/window.innerWidth-0.5)*2
	var y = -(e.clientY/window.innerHeight-0.5)*2

	var mat = mat4.create()
	
	mat4.invert(mat, camera.projection)
	mat4.invert(cam, cam)
	
	
	var n = [0, 0, 0]
	var v = [x, y, -1]

	vec3.transformMat4(v, v, mat)
	vec3.transformMat4(v, v, cam)

	vec3.transformMat4(n, n, cam)


	var v2 = vec3.create()
	vec3.sub(v2, v, n)

	var u = -n[2] / v2[2]
	vec3.scale(v2, v2, u)
	vec3.add(v2, v2, n)
	return v2
}

var editmode = {
	set: function(type, fn) {
		this.unset(type)
		eng.canvas.addEventListener(type, fn)
		this[type] = fn
	},
	unset: function(type) {
		eng.canvas.removeEventListener(type, this[type])	
	}
}

buildingmode.onclick = function() {
	var move = function(e) {
		var o = eng.scene.objects[0]
		o.position = unprojecttoground(e)
	}

	var click = function(e) {
		if(e.button != 0) return
		var o  = eng.scene.objects[0]
		var n = {}
		for(var i in o) n[i] = o[i]
		eng.scene.objects.push(n)
	}

	editmode.set('click', click)
	editmode.set('mousemove', move)
}

window.addEventListener('keydown', function(e) {
	if(e.keyCode == 27) {
		editmode.unset('click')
		editmode.unset('mousemove')
	}
})

var mvert = [
	[-1, -1, 0],
	[1, -1, 0],
	[0, 2, 0]
]

var mcol = [
	[0.4, 1.0, 0.3],
	[0.4, 1.0, 0.3],
	[0.4, 1.0, 0.3]
]

var mnor = [
	[0, 0, 1],
	[0, 0, 1],
	[0, 0, 1]
]

var marker = new model()
marker.vertex = eng.buffer()
marker.color= eng.buffer()
marker.normal= eng.buffer()

marker.color.data(mcol)
marker.normal.data(mnor)
marker.vertex.data(mvert)

marker.program = prog


function atan2(x, y) {
	if(x > 0) return Math.atan(y/x)
	if(y >= 0 && x < 0) return Math.atan(y/x) + Math.PI
	if(y < 0 && x < 0) return Math.atan(y/x) - Math.PI
	if(y > 0 && x == 0) return Math.PI / 2
	if(y < 0 && x == 0) return - Math.PI / 2
	return 0
}


roadmode.onclick = function() {
	var curve, emar;

	var curvemove = function(e) {
		var p = unprojecttoground(e)
		var p2 = [p[0], p[1]]

		var dir = [0, 20]
		var mat = mat2.create()
		mat2.identity(mat)
		mat2.rotate(mat, mat, -emar.rotation[2])
		vec2.transformMat2(dir, dir, mat)
		vec2.add(dir, dir, emar.position)

		curve.p[1] = dir
		curve.p[2] = p2

		var an = new anchor()
		an.model = curve.model(eng)
		an.model.program = prog
		eng.scene.objects.pop()
		eng.scene.objects.push(an)
	}

	var doneclick = function(e) {
		if(e.button != 0) return
		editmode.unset('mousemove')
		editmode.set('click', click)
	}

	var begincurve = function(e) {
		if(e.button != 0) return

		var p = unprojecttoground(e)

		var p2 = [p[0], p[1]]

		editmode.set('mousemove', curvemove)
		editmode.set('click', doneclick)
	}

	var directionmove = function(e) {
		var p = unprojecttoground(e)

		var dir = vec2.create()
		vec2.sub(dir, emar.position, p)
		vec2.normalize(dir,dir)
		
		var angle = atan2(dir[0], dir[1]) + Math.PI / 2
		emar.rotation[2] = angle
	}
	
	var click = function(e) {
		if(e.button != 0) return

		var p = unprojecttoground(e)

		var p2 = [p[0], p[1]]
		curve = new bezier(p2.slice(), p2.slice(), p2.slice())

		emar = new anchor()
		emar.model = marker
		emar.position = p

		eng.scene.objects.push(emar)
		
		editmode.set('click', begincurve)
		editmode.set('mousemove', directionmove)
	}
	
	editmode.set('click', click)
	editmode.unset('mousemove', directionmove)
}

window.addEventListener('mousedown', function(e) {
	if(e.button != 1) return;
	var x = e.clientX

	var events = {
		mousemove: function(e) {
			eng.scene.camera.rotation[2] += (e.clientX - x) / 500
			x = e.clientX
		},
		mouseup: function(e) {
			for(var i in events)
				window.removeEventListener(i, events[i])
		}
	}

	for(var i in events)
		window.addEventListener(i, events[i]) 
})

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
	if(e.clientY > window.innerHeight - 100 && Math.abs(e.clientX - window.innerWidth / 2) > 200) y = (window.innerHeight-e.clientY) / 100 - 1
	c.velocity[0] = x
	c.velocity[1] = - y

})

eng.canvas.oncontextmenu = function(e) { e.preventDefault() }


}

