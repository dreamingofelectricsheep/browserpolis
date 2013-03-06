

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


var building_color= []
for(var i = 0; i < 30; i++) building_color.push([0.8, 0.7, 0.9])

var building_normal = [
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

var building_vertex = [
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


function buildingfactory() {
	var mat = mat4.create()
	mat4.identity(mat)
	mat4.scale(mat, mat, [Math.random() * 0.5 + 0.8,
		Math.random() * 0.5 + 0.8,
		Math.random() * 0.5 + 0.8])


	var vert = []
	for(var i in building_vertex) {
		var v = [0, 0, 0]
		vec3.transformMat4(v, building_vertex[i], mat)
		vert.push(v)
	}


	var buildingmodel = eng.model({
		vertex: vert,
		normal: building_normal,
		color: building_color })

	buildingmodel.program = prog

	return buildingmodel
}



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
	},
	leave: function() {}
}

buildingmode.onclick = function(e) {
	editmode.leave()
	editmode.leave = function() { 
		if(tmp != undefined) eng.scene.objects.pop()
		this.leave = function() {}
	}

	var tmp = undefined;
	var move = function(e) {
		if(tmp == undefined) return
		tmp.position = unprojecttoground(e)
	}

	var click = function(e) {
		if(e.button != 0) return
		tmp = new anchor()
		tmp.model = buildingfactory()
		move(e)
		eng.scene.objects.push(tmp)
	}

	click(e)

	editmode.set('click', click)
	editmode.set('mousemove', move)
}

window.addEventListener('keydown', function(e) {
	if(e.keyCode == 27) {
		editmode.leave()
		editmode.unset('click')
		editmode.unset('mousemove')
	}
})


var marker_model = eng.model({
	vertex: [
		[-1, -1, 0],
		[1, -1, 0],
		[0, 2, 0]
	],
	color: [
		[0.4, 1.0, 0.3],
		[0.4, 1.0, 0.3],
		[0.4, 1.0, 0.3]
	], 
	normal: [
		[0, 0, 1],
		[0, 0, 1],
		[0, 0, 1]
	]})

marker_model.program = prog


var quad_model = new model()

function atan2(x, y) {
	if(x > 0) return Math.atan(y/x)
	if(y >= 0 && x < 0) return Math.atan(y/x) + Math.PI
	if(y < 0 && x < 0) return Math.atan(y/x) - Math.PI
	if(y > 0 && x == 0) return Math.PI / 2
	if(y < 0 && x == 0) return - Math.PI / 2
	return 0
}


roadmode.onclick = function(e) {
	editmode.leave()
	var curve, marker;

	editmode.leave = function() {
		eng.scene.objects.pop()
		this.leave = function() {}
	}
	

	var curvemove = function(e) {
		var p = unprojecttoground(e)
		var p2 = [p[0], p[1]]

		var dir = [0, 20]
		var mat = mat2.create()
		mat2.identity(mat)
		mat2.rotate(mat, mat, -marker.rotation[2])
		vec2.transformMat2(dir, dir, mat)
		vec2.add(dir, dir, marker.position)

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
	
		start(e)
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
		vec2.sub(dir, marker.position, p)
		vec2.normalize(dir,dir)
		
		var angle = atan2(dir[0], dir[1]) + Math.PI / 2
		marker.rotation[2] = angle
	}
	
	var positionset = function(e) {
		if(e.button != 0) return

		var p = unprojecttoground(e)

		var p2 = [p[0], p[1]]
		curve = new bezier(p2.slice(), p2.slice(), p2.slice())
		
		editmode.set('click', begincurve)
		editmode.set('mousemove', directionmove)
	}

	var positionmove = function(e) {
		marker.position = unprojecttoground(e)
	}

	var start = function(e) {
		marker = new anchor()
		marker.model = marker_model
		positionmove(e)

		eng.scene.objects.push(marker)

		editmode.set('click', positionset)
		editmode.set('mousemove', positionmove)
	}
	
	start(e)

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

window.onmousewheel = window.onwheel = function(e) {
	var d = e.wheelDelta
	if(d == undefined) d = -e.deltaY * 30
	eng.scene.camera.distance = -Math.exp(Math.log(-eng.scene.camera.distance) - d / 1000)
}



for(var i = 0; i < 10; i++) {
		var tmp = new anchor()
		tmp.model = buildingfactory()
		tmp.position[0] = Math.random() * 15
		tmp.position[1] = Math.random() * 15
		eng.scene.objects.push(tmp)
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

