import { Component } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import * as L from "leaflet";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent
{

  public gameFilter: string = 'None';

  public gameStarted: boolean = false;

  // 1 = name the country
  // 2 = find the country
  public gameType: number;
  // Options are either 10 or max.
  public gameCountryCount: number;
  // TODO: Implement regions.
  public gameRegion: string = 'None';

  public currentCountryName: string = "";

  public filterCorrectAnswers: boolean = true;
  public dontHighlightProgress: boolean = false;
  public dontHighlightProgressState: boolean = false;
  public informationMode: boolean = false;
  public allGuesses: any[] = [];
  public incorrectGuesses: any[] = [];

  public currentHighlightedCountry: any;
  public previousColorForHighlightedCountry: string;

  public regions: string[] = [];
  public subregions: string[] = [];

  public guessedCountry: string = '';
  public correctAnswer: string = '';

  public startGame()
  {
    this.dontHighlightProgress = this.dontHighlightProgressState;
    this.allGuesses = [];
    this.incorrectGuesses = [];
    this.correctCount = 0;
    this.guessedCount = 0;
    this.alreadyGuessed = [];
    this.geoJSONLayer.eachLayer( (layer) =>
    {
      layer.setStyle({fillColor : 'black', color:'black'});
    });
    this.output = '';
    this.guessingProgress = '';
    window.dispatchEvent(new Event('resize'));



    this.countryFilterSelected();
    this.changeRegion();
    const gameTypeSelected = ((document.getElementById("gameType") as HTMLInputElement).value);

    this.gameType = gameTypeSelected === "1" || gameTypeSelected === "3" ? 1 : 2;
    this.gameCountryCount = gameTypeSelected === "1" || gameTypeSelected === "2" ? this.possibleCountries.length : Math.min(10, this.possibleCountries.length);

    this.gameStarted = true;

    this.filteredCountryNames.sort();
    this.loadNextCountry();
  }



  public countryFilterSelected()
  {
    this.gameFilter = ((document.getElementById("countryFilterSelector") as HTMLInputElement).value);
    if ( this.gameFilter === 'Regions' )
    {
      this.possibleCountries = this.regionCountries.get(this.regions[0]);
    }
    else if ( this.gameFilter === 'Subregions' )
    {
      this.possibleCountries = this.subregionCountries.get(this.subregions[0]);
    }
    else
    {
      this.possibleCountries = this.allCountries;
    }
  }

  public possibleCountries:any[] = [];
  public allCountries: any[] = [];
  public changeRegion()
  {
    console.log(this.gameFilter);
    if ( this.gameFilter != 'None' ) 
    {
      const str: string = this.gameFilter === 'Regions' ? "region" : "subregion";
      this.gameRegion = ((document.getElementById(str) as HTMLInputElement).value);
      if ( this.gameFilter === 'Regions' )
      {
        this.possibleCountries = this.regionCountries.get(this.gameRegion);
        this.allCountries.forEach(layer =>
        {
          if ( this.possibleCountries.includes(layer) )
          {
            layer.setStyle({fillColor: 'grey'});
          }
        });
      }
      else if ( this.gameFilter === 'Subregions' )
      {
        this.possibleCountries = this.subregionCountries.get(this.gameRegion);
        this.allCountries.forEach(layer =>
          {
            if ( this.possibleCountries.includes(layer) )
            {
              layer.setStyle({fillColor: 'grey'});
            }
          });
      }
    }
    else
    {
      console.log("hites the beans");
      this.possibleCountries = this.allCountries;
      this.possibleCountries.forEach( element => {
        element.setStyle({ fillColor: 'grey' });
      });
    }

    // this.possibleCountries.forEach( element => {
    //   element.setStyle({ color: 'purple' });
    // });

  }

  public highlightCountry( countryName: string )
  {
    if ( this.currentHighlightedCountry && this.currentHighlightedCountry.feature.properties.ADMIN === countryName) 
    {
      this.currentHighlightedCountry.setStyle({ fillColor: this.previousColorForHighlightedCountry });
      this.currentHighlightedCountry = null;
      return;
    }

    if ( this.currentHighlightedCountry )
    {
      this.currentHighlightedCountry.setStyle({ fillColor: this.previousColorForHighlightedCountry });
    }

    this.geoJSONLayer.eachLayer( (layer) =>
    {
      if ( layer.feature.properties.ADMIN === countryName )
      {
        this.currentHighlightedCountry = layer;
        this.previousColorForHighlightedCountry = layer.options.fillColor;
        layer.setStyle({fillColor : 'blue'});

        const coordinates = this.getBoundingBox(layer);
        let southWest = L.latLng( coordinates['yMin'], coordinates['xMin'] );
        let northEast = L.latLng( coordinates['yMax'], coordinates['xMax'] );
        let bounds = L.latLngBounds( southWest, northEast ).pad(.2);
        this.map.fitBounds( bounds );
      }
    });
  }

  public regionMapping: Map<string, string>;
  public subregionMapping: Map<string, string>;
  public regionCountries: Map<String, any[]>;
  public subregionCountries: Map<String, any[]>;
  onMapReady(map: L.Map)
  {
    this.regionMapping = new Map();
    this.subregionMapping = new Map();
    this.regionCountries = new Map();
    this.subregionCountries = new Map();

    this.validCountryCodes = [];
    this.countryNames = [];
    this.alreadyGuessed = [];
    // let self = this;
    this.http.get("assets/country_codes.json").subscribe(data =>
    {
      data['countries'].forEach(element => {
        this.validCountryCodes.push(element.code);
            if ( !this.regions.includes(element.region) )
            {
              this.regions.push(element.region);
              this.regionCountries.set(element.region, []);
            }
            if ( !this.subregions.includes(element.subregion) )
            {
              this.subregions.push(element.subregion);
              this.subregionCountries.set(element.subregion, []);
            }
    
            this.regionMapping.set( element.code, element.region );
            this.subregionMapping.set( element.code, element.subregion );
      });
    });

    this.http.get("assets/countries.geojson").subscribe((json: any) =>
    {
      this.json = json;
      this.geoJSONLayer = L.geoJSON(this.json, {style:{color: 'black', weight: 1}, 
      onEachFeature: (feature, layer) => 
      {
        if ( feature.properties.ISO_A3 != '-99' && this.validCountryCodes.includes(feature.properties.ISO_A3) )
        {
          this.regionCountries.get( this.regionMapping.get(feature.properties.ISO_A3)).push( layer );
          this.subregionCountries.get( this.subregionMapping.get(feature.properties.ISO_A3)).push( layer );

          this.countryCount += 1;
          this.countryNames.push(feature.properties.ADMIN);
          this.allCountries.push(layer);
          layer.on('click', (e) =>
          {
            this.countrySelected(layer);
          });
        }
      }}).addTo(map);

      console.log(this.map);


    });
    this.filteredCountryNames = this.countryNames;
    this.filteredCountryNames.sort();

    this.map = map;
    this.possibleCountries = this.allCountries;
  }

  public countrySelected(layer: any)
  {
    // if (this.informationMode)
    // {
    //   layer.bindTooltip(layer['feature'].properties.ADMIN).openTooltip();
    // }

    if ( !this.gameStarted || this.gameType == 1 ) return;

    if ( this.currentCountryName == layer['feature'].properties.ADMIN )
    {
      if (!this.dontHighlightProgress) this.currentCountry.setStyle({fillColor: 'green'});
      this.correctCount += 1;
    }
    else
    {
      if (!this.dontHighlightProgress) this.currentCountry.setStyle({fillColor: 'red'});
      this.incorrectGuesses.push( {
        'guessed' : layer['feature'].properties.ADMIN,
        'correct' : this.currentCountryName
      } );
    }
    this.allGuesses.push( {
      'guessed' : layer['feature'].properties.ADMIN,
      'correct' : this.currentCountryName
    } );
    this.guessedCountry = layer['feature'].properties.ADMIN;
    this.guessedCount += 1;
    this.loadNextCountry();
    this.guessingProgress = 'You have guessed ' + this.correctCount + ' correctly out of ' + this.guessedCount + ', you have ' + (this.gameCountryCount - this.guessedCount) + ' more to go.';
    window.dispatchEvent(new Event('resize'));
  }

  public loadNextCountry()
  {
    if ( this.gameCountryCount == this.guessedCount )
    {
      this.output = '';
      this.guessingProgress = 'You have guessed ' + this.correctCount + ' correctly out of ' + this.gameCountryCount + ', you are done!' ;
      this.gameStarted = false;
      return;
    }

    let currentCount: number = 0;
    let countryToHighlight = Math.floor(Math.random() * (this.possibleCountries.length - this.guessedCount)) + 1;

    let coordinates;
    this.possibleCountries.forEach(element => {
      if (!this.alreadyGuessed.includes(element.feature.properties.ADMIN))
      {
        currentCount += 1;
        if ( currentCount == countryToHighlight )
        {
          if ( this.gameType == 1 )
          {
            coordinates = this.getBoundingBox(element);
            element.setStyle({fillColor: 'yellow'});
          }

          this.currentCountry = element;
          this.currentCountryName = element.feature.properties.ADMIN;
        }
      }

    });
    this.alreadyGuessed.push(this.currentCountry.feature.properties.ADMIN);

    if ( this.gameType == 1 )
    {
      let southWest = L.latLng( coordinates['yMin'], coordinates['xMin'] );
      let northEast = L.latLng( coordinates['yMax'], coordinates['xMax'] );
      let bounds = L.latLngBounds( southWest, northEast ).pad(.2);
      this.map.fitBounds( bounds );
    }

  }

  public countryCount: number = 0;
  public geoJSONLayer: any;
  public currentCountry: any = null;

  public output: string;

  public map: L.Map;
  json;
  options = {
    layers: [
      L.tileLayer('')
    ],
    zoom: 6,
    center: L.latLng(47.482019, -1)
  };

  constructor(private http: HttpClient) {}

  public validCountryCodes: string[];
  public countryNames: string[];
  public alreadyGuessed: string[];

  
  



  public guessedCount: number = 0;
  public correctCount: number = 0;

  public guessingProgress: string;

  public guessName()
  {
    let guessedName = ((document.getElementById("guess") as HTMLInputElement).value);

    if ( guessedName.toLowerCase() == this.currentCountry.feature.properties['ADMIN'].toLowerCase() || this.currentCountry.feature.properties['ADMIN'].toLowerCase().includes(guessedName.toLowerCase()) )
    {
      this.correctCount += 1;
      if (!this.dontHighlightProgress) this.currentCountry.setStyle({fillColor: 'green'});
    }
    else
    {
      if (!this.dontHighlightProgress) this.currentCountry.setStyle({fillColor: 'red'});
      this.incorrectGuesses.push( {
        'guessed' : guessedName,
        'correct' : this.currentCountryName
      } );
    }
    this.allGuesses.push( {
      'guessed' : guessedName,
      'correct' : this.currentCountryName
    } );
    this.guessedCount += 1;
    this.guessedCountry = guessedName;
    this.correctAnswer = this.currentCountryName;

    this.output = 'You guessed "' + guessedName + '" and the correct answer was "' + this.currentCountry.feature.properties['ADMIN'] + '"';
    this.guessingProgress = 'You have guessed ' + this.correctCount + ' correctly out of ' + this.guessedCount + ', you have ' + (this.gameCountryCount - this.guessedCount) + ' more to go.';

    this.loadNextCountry();
  }


  public getBoundingBox(data)
  {
    var bounds = {}, coordinates, point, latitude, longitude;
    coordinates = data.feature.geometry.coordinates;
  
    if(data.feature.geometry.type == 'Polygon')
    {
      // It's only a single Polygon
      // For each individual coordinate in this feature's coordinates...
      for (var j = 0; j < coordinates[0].length; j++)
      {
        longitude = coordinates[0][j][0];
        latitude  = coordinates[0][j][1];

        // Update the bounds recursively by comparing the current xMin/xMax and yMin/yMax with the current coordinate
        bounds['xMin'] = bounds['xMin'] < longitude ? bounds['xMin'] : longitude;
        bounds['xMax'] = bounds['xMax'] > longitude ? bounds['xMax'] : longitude;
        bounds['yMin'] = bounds['yMin'] < latitude ? bounds['yMin'] : latitude;
        bounds['yMax'] = bounds['yMax'] > latitude ? bounds['yMax'] : latitude;
      }
    }
    else
    {
      // It's a MultiPolygon
      // Loop through each coordinate set
      for (var j = 0; j < coordinates.length; j++) {
        // For each individual coordinate in this coordinate set...
        for (var k = 0; k < coordinates[j][0].length; k++) {
          longitude = coordinates[j][0][k][0];
          latitude  = coordinates[j][0][k][1];

          // Update the bounds recursively by comparing the current xMin/xMax and yMin/yMax with the current coordinate
          bounds['xMin'] = bounds['xMin'] < longitude ? bounds['xMin'] : longitude;
          bounds['xMax'] = bounds['xMax'] > longitude ? bounds['xMax'] : longitude;
          bounds['yMin'] = bounds['yMin'] < latitude ? bounds['yMin'] : latitude;
          bounds['yMax'] = bounds['yMax'] > latitude ? bounds['yMax'] : latitude;
        }
      }
    }
  
    // Returns an object that contains the bounds of this GeoJSON data.
    // The keys describe a box formed by the northwest (xMin, yMin) and southeast (xMax, yMax) coordinates.
    return bounds;
  }


  
  public filteredCountryNames: string[];
  public filterStateTable( event: KeyboardEvent )
  {
    this.filteredCountryNames = [];
    const filterString = (event.target as HTMLInputElement).value;
    for ( let country of this.countryNames )
    {
      if ( country.toLowerCase().includes(filterString.toLowerCase()) )
        this.filteredCountryNames.push(country);
    }
  }

}
