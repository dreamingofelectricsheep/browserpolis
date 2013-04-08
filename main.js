window.onload = function() {

var body = document.getElementsByTagName('body')[0]

var buttons = tags.div({ class: 'button-box' }, 
	tags.div({ id: 'road', class: 'button' }, 'Road'), 
	tags.div({ id: 'building', class: 'button' }, 'Building'))

body.appendChild(buttons)


var eng = new engine(body)


var vertext = document.getElementById('shader-vs').innerHTML
var fragtext = document.getElementById('shader-fs').innerHTML

var vs = eng.vertex_shader(vertext)
var fs = eng.fragment_shader(fragtext)

var prog = eng.program(vs, fs)




function vector_sign(p1, p2, p3)
{
	return vec2.cross([], vec2.sub([], p1, p3), vec2.sub([], p2, p3))[2] < 0
}

function inside(p, v1, v2, v3)
{

	var b1 = vector_sign(p, v1, v2),
		b2 = vector_sign(p, v2, v3),
		b3 = vector_sign(p, v3, v1)

	return ((b1 == b2) && (b2 == b3))
}
	

function make_building(edges, height)
{
	var e = edges.slice(0),
		vertices = [],
		i = 0

	while(e.length > 2)
	{
		i++
		i = i % e.length
		var trig = [e[i], e[(i+1) % e.length], e[(i+2) % e.length]]

		if(vector_sign(trig[0], trig[1], trig[2]) == true)
			continue

		var ear = true
		
		for(var j = (i + 3) % e.length; j != i; j = (j + 1) % e.length)
		{
			if(inside(e[j], trig[0], trig[1], trig[2]))
			{
				ear = false
				break
			}
		}

		if(ear == true)
		{
			vertices.push(trig[0], trig[1], trig[2])
			e.splice((i+1) % e.length, 1)
		}
	}
		

	var normal = [],
		color = []

	for(var i in vertices)
	{
		normal.push([0, 0, 1])
		color.push([0.8, 0.7, 0.9])
	}
		
		


	if(vertices.length == 0) return undefined


	var buildingmodel = eng.model(
		{
			vertex: vertices,
			normal: normal,
			color: color 
		})

	buildingmodel.program = prog

	return buildingmodel
}



eng.scene = {
	camera: new camera(),
	objects: {}
}

var city =
{
	roads: {},
	buildings: {}
}

var __guid = 0
function guid()
{
	return __guid++;
}

function unprojecttoground(e)
{
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

var quadmodel = eng.model({
	vertex: [
		[-1, -1, 0.1],
		[1, -1, 0.1],
		[-1, 1, 0.1],
		[1, -1, 0.1],
		[1, 1, 0.1],
		[-1, 1, 0.1]],
	normal: [
		[0, 0, 1],
		[0, 0, 1],
		[0, 0, 1],
		[0, 0, 1],
		[0, 0, 1],
		[0, 0, 1]],
	color: [
		[0.4, 0.8, 0.5],
		[0.4, 0.8, 0.5],
		[0.4, 0.8, 0.5],
		[0.4, 0.8, 0.5],
		[0.4, 0.8, 0.5],
		[0.4, 0.8, 0.5]] })

quadmodel.program = prog


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

buttons.$building.onclick = function(e) {
	editmode.leave()
	editmode.leave = function() { 
		eng.scene.objects.pop()
		this.leave = function() {}
	}

	var edges = [],
		building = new anchor()

	eng.scene.objects.push(building)

	var click = function(e) {
		if(e.button != 0) return

		var p = unprojecttoground(e)
		edges.push(p)

		building.model = make_building(edges, 0)
	}

	editmode.set('click', click)
	editmode.unset('mousemove')
}

window.addEventListener('keydown', function(e) {
	if(e.keyCode == 27) {
		editmode.leave()
		editmode.unset('click')
		editmode.unset('mousemove')
	}
})



function atan2(x, y)
{
	if(x > 0) return Math.atan(y/x)
	if(y >= 0 && x < 0) return Math.atan(y/x) + Math.PI
	if(y < 0 && x < 0) return Math.atan(y/x) - Math.PI
	if(y > 0 && x == 0) return Math.PI / 2
	if(y < 0 && x == 0) return - Math.PI / 2
	return 0
}


buttons.$road.onclick = function(e)
{
	editmode.leave()
	var curve, marker, startmarker, ctrla, ctrlb, focus = undefined;

	editmode.leave = function() {
		delete eng.scene.objects['marker']
		delete eng.scene.objects['ctrlb']
		delete eng.scene.objects['ctrla']
		delete eng.scene.objects['startmarker']
		delete eng.scene.objects['road']
		this.leave = function() {}
	}

	var done = function(e)
	{
		buttons.$road.click()
	}

	var align = function(a, b)
	{
		var dir = vec2.sub([], a.position, b.position)
		vec2.normalize(dir, dir)
		
		var angle = atan2(dir[0], dir[1]) + Math.PI / 4
		a.rotation[2] = b.rotation[2] = angle
	}
	
	var controlmove = function(e)
	{
		if(focus == undefined) return

		var p = unprojecttoground(e)
		var p2 = [p[0], p[1], 0]

		curve.p[focus.i] = p2
		focus.position = p2

		var a = eng.scene.objects['road']
		a.model = curve.model(eng)
		a.model.program = prog

		align(focus, focus.next)
	}

	var controlclick = function(e)
	{
		var p = unprojecttoground(e)
		
		if(focus != undefined)
		{
			focus = undefined
			return
		}

		if(vec2.distance(p, ctrla.position) < 1)
		{
			focus = ctrla
		}
		if(vec2.distance(p, ctrlb.position) < 1)
		{
			focus = ctrlb
		}
	}

	var curvemove = function(e)
	{
		positionmove(e)
		var p = marker.position

		var p2 = [p[0], p[1]]

		curve.p[2] = curve.p[3] = p2

		var a = eng.scene.objects['road']
		a.model = curve.model(eng)
		a.model.program = prog

		align(marker, startmarker)
	}

	var doneclick = function(e) {
		if(e.button != 0) return
		
		var id = guid()
		city.roads[id] = curve
		eng.scene.objects[id] = eng.scene.objects['road']

		ctrla = new anchor()
		ctrla.model = quadmodel
		ctrla.position = curve.point(0.3)
		ctrla.position[2] = 0
		ctrla.i = 1
		ctrla.next = startmarker

		ctrlb = new anchor()
		ctrlb.model = quadmodel
		ctrlb.position = curve.point(0.7)
		ctrlb.position[2] = 0
		ctrlb.i = 2
		ctrlb.next = marker

		eng.scene.objects['ctrlb'] = ctrlb
		eng.scene.objects['ctrla'] = ctrla

		align(ctrla, ctrla.next)
		align(ctrlb, ctrlb.next)

		editmode.set('click', controlclick)
		editmode.set('mousemove', controlmove)
	}

	var begincurve = function(e) {
		if(e.button != 0) return

		var p = unprojecttoground(e)

		var p2 = [p[0], p[1]]


		editmode.set('mousemove', curvemove)
		editmode.set('click', doneclick)
		curvemove(e)
	}


	
	var positionset = function(e) {
		if(e.button != 0) return

		positionmove(e)

		var p = marker.position

		var p2 = [p[0], p[1]]
		curve = new bezier(p2.slice(), p2.slice(), p2.slice(), p2.slice())

		var an = new anchor()
		an.model = curve.model(eng)
		an.model.program = prog

		eng.scene.objects['road'] = an

		startmarker = new anchor()
		startmarker.model = quadmodel
		startmarker.position = marker.position

		eng.scene.objects['startmarker'] = startmarker


		editmode.set('mousemove', curvemove)
		editmode.set('click', doneclick)
	}

	var positionmove = function(e) {
		var p = unprojecttoground(e)


		var pt, d = 3

		for(var i in city.roads)
		{
			var r = city.roads[i].nearest(p)
			
			if(r.distance < d)
			{
				d = r.distance
				pt = { road: city.roads[i], t: r.location }
			}
		}

			
		if(d < 3)
		{
			p = pt.road.point(pt.t)
			p[2] = 0
		}

		marker.position = p

	}

	var start = function(e) {
		marker = new anchor()
		marker.model = quadmodel
		positionmove(e)

		eng.scene.objects['marker'] = marker

		editmode.set('click', positionset)
		editmode.set('mousemove', positionmove)
	}
	
	start(e)

}

window.addEventListener('mousedown', function(e)
{
	if(e.button != 1) return;
	var x = e.clientX

	var events =
	{
		mousemove: function(e)
		{
			eng.scene.camera.rotation[2] += (e.clientX - x) / 500
			x = e.clientX
		},
		mouseup: function(e)
		{
			for(var i in events)
				window.removeEventListener(i, events[i])
		}
	}

	for(var i in events)
		window.addEventListener(i, events[i]) 
})

window.onmousewheel = window.onwheel = function(e)
{
	var d = e.wheelDelta
	if(d == undefined) d = -e.deltaY * 30
	eng.scene.camera.distance = -Math.exp(Math.log(-eng.scene.camera.distance) 
		- d / 1000)
}

	

eng.draw()

window.addEventListener('mousemove', function(e) {
	var c = eng.scene.camera
	var x = 0;
	var y = 0;
	
	if(e.clientX < 100) x = 1 - e.clientX / 100
	if(e.clientX > window.innerWidth - 100) x = (window.innerWidth-e.clientX) / 100 - 1
	if(e.clientY < 100) y = 1 - e.clientY / 100
	if(e.clientY > window.innerHeight - 100 && 
		Math.abs(e.clientX - window.innerWidth / 2) > 200) 
		y = (window.innerHeight-e.clientY) / 100 - 1

	c.velocity[0] = x
	c.velocity[1] = -y

})

eng.canvas.oncontextmenu = function(e) { e.preventDefault() }

window.ondrag = function(e) { e.preventDefault() }

}

