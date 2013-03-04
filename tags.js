function tags(tag, options, children) {
	var element = document.createElement(tag)

	for(var i in options)
		element.setAttribute(i, options[i])
	
	for(var i in children)
		if(typeof children[i] == 'object')
			element.appendChild(children[i])
		else
			element.innerHTML = children[i]
	
	return element
}

(function() {
	for(var i in arguments)
		(function(tag) { 
			tags[tag] = function(options) { 
				var children = Array.prototype.slice.call(arguments)

				if(typeof options != undefined)
					children = children.slice(1)

				return tags(tag, options, children) 
			} 
		})(arguments[i])
})('html', 'div', 'p', 'input', 'body', 'a', 'textarea')
