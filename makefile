
_:
	@echo 'make manifest 	- rebuild the offline manifest'
manifest:
	@./make-cache-manifest.sh > cache.manifest
