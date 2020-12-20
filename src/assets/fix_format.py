with open('country_codes') as ifile:
	with open('country_codes2', 'w') as ofile:
		for line in ifile:
			parts = line.split(' ', 1)
			ofile.write(parts[0] + ',' + parts[1])