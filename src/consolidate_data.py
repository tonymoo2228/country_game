import json

class Countries:

    def __init__( self, countries ):
        self.countries = [ i.__dict__ for i in countries ]

class Country:

    def __init__(self, region, subregion, name, code):
        self.region = region
        self.subregion = subregion
        self.code = code
        self.name = name

if __name__ == '__main__':
    country_regions = {}
    with open('assets//UNSD — Methodology.csv') as ifile:
        for line in ifile:
            data = line.strip().split(",")
            print(data[3], data[5], data[8], data[11])
            country_regions[data[11]] = Country(data[3], data[5], data[8], data[11])

    print(country_regions)

    finished_data = []
    with open('assets//country_codes2') as ifile:
        for line in ifile:
            data = line.strip().split(',', 1)
            if data[0].startswith('--'): continue
            if data[0] in country_regions:
                finished_data.append(country_regions[data[0]])
            elif data[0] == 'TWN':
                finished_data.append( Country('Asia', 'Eastern Asia', 'Taiwan', data[0]) )
            elif data[0] == 'KOS':
                finished_data.append( Country('Europe', 'Southern Europe', 'Kosovo', data[0]) )

    c = Countries( finished_data )
    print(json.dumps(c.__dict__))

    with open('assets//country_codes.json', 'w') as ofile:
        ofile.write(json.dumps(c.__dict__))

