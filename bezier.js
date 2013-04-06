//Only quadratic curves are supported right now
function bezier()
{
	this.p = arguments
}

bezier.prototype = {
	point: function(t)
	{
		var t1 = vec2.create()
		var t2 = vec2.create()
		vec2.lerp(t1, this.p[0], this.p[1], t)
		vec2.lerp(t2, this.p[1], this.p[2], t)
		vec2.lerp(t1, t1, t2, t)
		return t1
	},
	model: function(eng)
	{
		var l = 0,
			t = vec2.create()

		for(var i = 0; i < 2; i++)
		{
			vec2.sub(t, this.p[i], this.p[i + 1])
			l += vec2.length(t)
		}

		l = Math.ceil(l)

		var vertex = [], normal = [], color = [],
			points = []

	
		for(var i = 0; i - 1 < l; i++)
		{
			var p2 = this.point(i/l),
				p1 = this.point((i+1)/l)
			
			var up = [0, 0, 1]
			var p = vec3.create()
			vec2.sub(p, p1, p2)
			p[2] = 0
			vec3.cross(p, up, p)
			vec2.normalize(p, p)

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
	}
}
















