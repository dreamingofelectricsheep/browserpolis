//Only quadratic curves are supported right now
function bezier()
{
	this.p = Array.prototype.slice.call(arguments)
}

bezier.prototype = {
	point: function(t)
	{
		var p = this.p.slice()

		while(p.length > 1)
		{
			var a = []
			for(var i = 0; i + 1 < p.length; i++)
			{
				a.push(vec2.lerp([], p[i], p[i + 1], t))
			}
			p = a
		}

		return p[0]
	},
	model: function(eng)
	{
		var l = 0

		for(var i = 0; i < this.p.length - 1; i++)
		{
		
			l += vec2.length(vec2.sub([], this.p[i], this.p[i + 1]))
		}

		l = Math.ceil(l)

		var vertex = [], normal = [], color = [],
			points = []

		
		var side = function(p1, p2)
		{
			var up = [0, 0, 1]
			var p = vec3.create()
			vec2.sub(p, p1, p2)
			p[2] = 0
			vec3.cross(p, up, p)
			vec2.normalize(p, p)
			return p
		}
	
		for(var i = 0; i-1 < l; i++)
		{
			var p2 = this.point(i/l),
				p1 = this.point((i+1)/l)

			var p = side(p1, p2)
		
			points.push(
				[
					[p2[0] + p[0], p2[1] + p[1], 0],
					[p2[0] - p[0], p2[1] - p[1], 0]
				])
		}

		for(var i = 1; i < points.length; i++)
		{
			vertex.push(
				points[i-1][0],
				points[i-1][1],
				points[i][0],

				points[i][0],
				points[i][1],
				points[i-1][1]
			)
		}

		if(l != 0)
		{
			var halfcircle = function(ps)
			{
				var mid = vec2.lerp([], ps[0], ps[1], 0.5)
				var p = vec2.sub([], ps[0], mid)

				var subdiv = 64

				var rot = mat2.create()
				mat2.identity(rot)
				mat2.rotate(rot, rot, -Math.PI/subdiv*2)

				var fan = [p]
				
				for(var i = 0; i < subdiv; i++)
					fan.push(vec2.transformMat2([], fan[i], rot))

				for(var i in fan) 
					vec2.add(fan[i], mid, fan[i])

				for(var i = 0; i < subdiv; i++)
				{
					vertex.push(
							[mid[0], mid[1], 0],
							[fan[i][0], fan[i][1], 0],
							[fan[i+1][0], fan[i+1][1], 0])
				}
			}

			halfcircle(points[0])
			halfcircle(points[points.length-1])
		}

		

		for(var i in vertex)
		{
			normal.push([0, 0, 1]) 
			color.push([0.4, 0.5, 0.8]) 
		}

		var m = eng.model(
			{
				vertex: vertex, 
				normal: normal,
				color: color
			})

		return m
	},
	nearest: function(p)
	{
		var a =
		{
			x: p[0],
			y: p[1]
		}

		var curve = []
		for(var i in this.p)
		{
			curve.push({ x: this.p[i][0], y: this.p[i][1]})
		}

		return jsBezier.distanceFromCurve(a, curve)
	}
}
















