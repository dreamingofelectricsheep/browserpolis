
manifest='CACHE MANIFEST'

files=`ls`
for file in $files
do
	manifest=$manifest$'\n'$file
done

echo "$manifest"
