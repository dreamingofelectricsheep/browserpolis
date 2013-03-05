//Only quadratic curves are supported right now
function bezier() {
	this.p = arguments
}

bezier.prototype = {
	point: function(t) {
		var t1 = vec2.create()
		var t2 = vec2.create()
		vec2.lerp(t1, this.p[0], this.p[1], t)
		vec2.lerp(t2, this.p[1], this.p[2], t)
		vec2.lerp(t1, t1, t2, t)
		return t1
	},
	length: function() {
		var p0 = this.p[0], 
			p1 = this.p[1], 
			p2 = this.p[2]

		var a = vec2.create(), 
			b = vec2.create()

		a[0] = p0[0] - 2*p1[0] + p2[0]
		a[1] = p0[1] - 2*p1[1] + p2[1]
		b[0] = 2*p1[0] - 2*p0[0]
		b[1] = 2*p1[1] - 2*p0[1]
		var A = 4*(a[0]*a[0] + a[1]*a[1]),
			B = 4*(a[0]*b[0] + a[1]*b[1]),
			C = b[0]*b[0] + b[1]*b[1]

		var Sabc = 2*Math.sqrt(A+B+C)
		var A_2 = Math.sqrt(A)
		var A_32 = 2*A*A_2
		var C_2 = 2*Math.sqrt(C)
		var BA = B/A_2

		if(A_32 == 0 || BA + C_2 == 0) return 0
		return ( A_32*Sabc + A_2*B*(Sabc-C_2) + (4*C*A-B*B)*Math.log( (2*A_2+BA+Sabc)/(BA+C_2) ) )/(4*A_32)
	},
	model: function(eng) {
		var r = 0.5

		var l = this.length()
		if(l == 0) l = r
		l = 10
		var vertex = [], normal = [], color = []
	
		for(var i = 0; i < l; i++) {
			var p2 = this.point(i/l),
				p1 = this.point((i+1)/l)
			
			var up = [0, 0, 1]
			var p = vec3.create()
			vec2.sub(p, p1, p2)
			p[2] = 0
			vec3.cross(p, up, p)
			vec2.normalize(p, p)

			vertex.push([p1[0], p1[1], 0],
				[p2[0] + p[0], p2[1] + p[1], 0],
				[p2[0] - p[0], p2[1] - p[1], 0])
			
		}

		for(var i in vertex) {
			normal.push([0, 0, 1]) 
			color.push([0.4, 0.5, 0.8]) 
		}

		var m = new model()
		m.vertex = eng.buffer()
		m.vertex.data(vertex)
		m.normal= eng.buffer()
		m.normal.data(normal)
		m.color = eng.buffer()
		m.color.data(color)

		return m;
	}

}
















