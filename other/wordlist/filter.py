import sys, re

if len(sys.argv) < 2:
	print 'Please enter a word file.'
	sys.exit()

filename = sys.argv[1]
file = open(filename, 'r')
writeFile = open('filteredWords', 'w')

for line in file:
	if re.match('^[a-z]*$', line):
		writeFile.write(line + '\n');

print "The words list has been successfully filtered and saved to 'filteredWords'"
