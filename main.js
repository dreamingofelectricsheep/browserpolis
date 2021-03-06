module('mainblob', function(tags) {

var body = document.getElementsByTagName('body')[0]



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



var makecircle = function(r, subdivisions)
{
	var c = [0, 0, 0.1],
		p = [r, 0, 0.1],
		pts = [p]

	each(range(1, subdivisions), function(i)
		{
			var rot = mat2.rotate([], mat2.identity([]), 2 * Math.PI / subdivisions * i)
			pts.push(vec2.transformMat2(vec3.create(), p, rot))
		})


	var vertices = []
	each(pts, function(pt) { pt[2] = 0.1 })

	each(pts, function(pt, i)
		{
			vertices.push(c, pts[i], pts[(i + 1) % pts.length])
		})

	var colors = [], normals = []

	each(vertices, function()
		{
			colors.push([0.2, 0.9, 0.7])
			normals.push([0, 0, 1])
		})


	return eng.model({ vertex: vertices, color: colors, normal: normals })
}
			

var circlemodel = makecircle(0.5, 64)
circlemodel.program = prog
	

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

var menu_building = function(e) {
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


var menu_road = function(e)
{
	editmode.leave()
	var curve, id = undefined, marker = [], focus = undefined;

	editmode.leave = function() 
	{
		each(marker, function(v, k)
			{
				delete eng.scene.objects['marker' + k]
			})

		if(id != undefined)
			city.roads[id] = curve

		delete eng.scene.objects['road']
		this.leave = function() {}
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
	
		positionmove(e)

		curve.p[focus] = marker[focus].position

		var a = eng.scene.objects['road']
		a.model = curve.model(eng)
		a.model.program = prog

		align(marker[focus], marker[focus].sibling)
	}

	var controlclick = function(e)
	{
		var p = unprojecttoground(e)
		
		if(focus != undefined)
		{
			focus = undefined
			return
		}

		each(marker, function(v, k)
			{
				if(vec2.distance(p, v.position) < 2)
					focus = k
			})
	}

	var doneclick = function(e) {
		if(e.button != 0) return
		
		id = guid()
		eng.scene.objects[id] = eng.scene.objects['road']

		marker[1].sibling = marker[0]
		marker[0].sibling = marker[1]
		marker[3].sibling = marker[2]
		marker[2].sibling = marker[3]

		each([1, 2], function(v) 
			{ 
				marker[v].position = curve.point(v/3)
				marker[v].position[2] = 0
				eng.scene.objects['marker' + v] = marker[v]
				align(marker[v], marker[v].sibling)
				curve.p[v] = marker[v].position
			})

		focus = undefined

		editmode.set('click', controlclick)
		editmode.set('mousemove', controlmove)
	}


	var curvemove = function(e)
	{
		positionmove(e)

		curve.p[2] = curve.p[3] = marker[focus].position

		var a = eng.scene.objects['road']
		a.model = curve.model(eng)
		a.model.program = prog

		align(marker[focus], marker[0])
	}

	
	var positionset = function(e) {
		if(e.button != 0) return

		positionmove(e)

		var p = marker[0].position
		var p2 = [p[0], p[1]]

		curve = new bezier(p2.slice(), p2.slice(), p2.slice(), p2.slice())

		var an = new anchor()
		an.model = curve.model(eng)
		an.model.program = prog

		eng.scene.objects['road'] = an


		eng.scene.objects['marker3'] = marker[3]
		focus = 3
		marker[3].position = marker[0].position


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

		marker[focus].position = p
	}

	var start = function(e)
	{
		for(var i = 0; i < 4; i++)
		{
			marker[i] = new anchor()
			marker[i].model = circlemodel
		}
		
		focus = 0

		positionmove(e)

		eng.scene.objects['marker0'] = marker[0]

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

window.addEventListener('mouseup', function(e) 
{
	if(e.button != 2) return

	var menu = tags.ul({ class: 'menu',
		style: 
			{ 
				left: e.clientX,
				top: e.clientY
			},
		},
		tags.li({ name: 'road' }, 'Road'),
		tags.li({ name: 'building' }, 'Building'))

	for(var i = 0; i < menu.children.length; i++)
	{
		var angle = 30/2 + (i - menu.children.length/2) * 30
	}

	menu.$road.onclick = menu_road

	tags.append(body, menu)

	var call = function(e)
	{
		window.removeEventListener('mouseup', call)

		setTimeout(function() {
				body.removeChild(menu);
			}, 100)
	}
	
	window.addEventListener('mouseup', call)
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
	if(e.clientY > window.innerHeight - 100) y = (window.innerHeight-e.clientY) / 100 - 1

	c.velocity[0] = x
	c.velocity[1] = -y

})

eng.canvas.oncontextmenu = function(e) { e.preventDefault() }

window.ondrag = function(e) { e.preventDefault() }


})
