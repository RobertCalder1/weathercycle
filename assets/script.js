var segmentRow = document.getElementById("segment-row");
var weatherDisplay = document.getElementById("weather-display")
var corners;
var checkCorners;
var searchBtn = document.querySelector(".search-button");
var searchBar = document.querySelector(".search-bar-input");
var newMarker;
var segmentStartCoordinates = [];
var segmentEndCoordinates = [];
var tableRow = document.getElementsByClassName("segment");

//create map on webpage
var platform = new H.service.Platform({
  apikey: "008f6Zpp12pnLUFDNojWj2nfBoDXAdjP4uyM2aVODZQ",
});
var defaultLayers = platform.createDefaultLayers();
var map = new H.Map(
  document.querySelector(".map"),
  defaultLayers.vector.normal.map,
  {
    center: { lat: -37.8136, lng: 144.9631 },
    zoom: 4,
  }
);
document.addEventListener("resize", () => map.getViewPort().resize());
var corners;
var checkCorners;

//center map on melbourne
function moveMapToMelbourne(map) {
  map.setCenter({ lat: -37.8136, lng: 144.9631 });
  map.setZoom(10);
}

//make map interactive
var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

//create UI
var ui = H.ui.UI.createDefault(map, defaultLayers);
//remove default mapsettings control
ui.removeControl("mapsettings");
// create custom UI
var ms = new H.ui.MapSettingsControl({
  baseLayers: [
    {
      label: "normal",
      layer: defaultLayers.raster.normal.map,
    },
    {
      label: "satellite",
      layer: defaultLayers.raster.satellite.map,
    },
    {
      label: "terrain",
      layer: defaultLayers.raster.terrain.map,
    },
  ],
});
ui.addControl("customized", ms);

function getMapCoordinates() {
  var mapView = map.getViewModel();
  var mapCorners = mapView.b.bounds.cb.X;
  corners = [mapCorners[9], mapCorners[10], mapCorners[3], mapCorners[4]];
  var mapLocation = mapView.b.position;
  var latitude = mapView.b.position.lat;
  var longitude = mapView.b.position.lng;
  fetchWeatherData(latitude, longitude)
}

function checkCornersValue() {
  var mapView = map.getViewModel();
  var mapCorners = mapView.b.bounds.cb.X;
  checkCorners = [mapCorners[9], mapCorners[10], mapCorners[3], mapCorners[4]];
}

function waitToRun() {
  checkCornersValue();

  if (JSON.stringify(corners) !== JSON.stringify(checkCorners)) {
    getMapCoordinates();
    fetchStravaData();
  }
  setTimeout(waitToRun, 2500);
}

waitToRun();

//add function for search bar
function geocode() {
  var geocoder = platform.getSearchService(),
    geocodingParameters = {
      q: searchBar.value,
    };

  geocoder.geocode(geocodingParameters, onSuccess, onError);
}

function onSuccess(result) {
  //console.log(result);
  var locations = result.items;
  //console.log(locations);
  var locationPosition = locations[0].position;
  //console.log(locations);
  map.setCenter(locationPosition);
  if (locations[0].resultType === "locality") {
    map.setZoom(13);
  } else {
    map.setZoom(16);
  }
}

function onError(error) {
  alert("Can't reach the remote server");
}

function createRoute(event) {
  var elem = event.target.parentNode;
  //console.log("event", elem);

  var data = JSON.parse(elem.getAttribute("data"));
  //console.log(data);
  //console.log(data.start);
  //console.log(data.end);
  var router = platform.getRoutingService(null, 8),
    routeRequestParams = {
      routingMode: "fast",
      transportMode: "pedestrian",
      origin: data.start.join(","),
      destination: data.end.join(","),
      return: "polyline,turnByTurnActions,actions,instructions,travelSummary",
    };
  router.calculateRoute(routeRequestParams, onSuccessRoute, onError);
}

function onSuccessRoute(result) {
  var route = result.routes[0];
  addRouteShapeToMap(route);
  //addManueversToMap(route);
}
function openBubble(position, text) {
  if (!bubble) {
    bubble = new H.ui.InfoBubble(
      position,
      // The FO property holds the province name.
      { content: text }
    );
    ui.addBubble(bubble);
  } else {
    bubble.setPosition(position);
    bubble.setContent(text);
    bubble.open();
  }
}
function addRouteShapeToMap(route) {
  route.sections.forEach((section) => {
    let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);
    let polyline = new H.map.Polyline(linestring, {
      style: {
        lineWidth: 8,
        strokeColor: "rgba(207, 0, 15, 1)",
      },
    });

    map.addObject(polyline);
  });
}

searchBtn.addEventListener("click", geocode);
searchBar.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    geocode();
  }
});

moveMapToMelbourne(map);

//function to get data from Strava API
function fetchStravaData() {
  let apiUrl =
    "https://www.strava.com/api/v3/segments/explore?bounds=" +
    corners +
    "&activity_type=riding&min_cat=0&max_cat=5";
  //console.log(apiUrl);
  fetch(apiUrl, {
    method: "GET",
    headers: {
      //Update key every 6 hours
      Authorization: "Bearer deb1a78241df01da5ff2b9ec54244f0f710b4c5b",
      "Content-Type": "application/json",
    },
  })
    .then(function (response) {
      if (response.ok) {
        ////console.log(response);
        response.json().then(function (data) {
          ////console.log(data);
          renderSegmentTable(data);
        });
      } else {
        //console.log("Error: " + response.statusText);
        return;
      }
    })
    .catch(function (error) {
      //console.log("unable to connect with Strava API");
      return;
    });
}

//function to display the table under the map with top 10 segments
function renderSegmentTable(data) {
  cleanScreen();
  if (data.segments !== null) {
    for (var i = 0; i < data.segments.length; i++) {
      let newRow = document.createElement("tr");
      newRow.setAttribute("class", "segment");
      //console.log(data.segments);
      segmentRow.appendChild(newRow);

      let segmentName = document.createElement("td");
      segmentName.textContent = data.segments[i].name;
      segmentName.setAttribute("class", "");
      newRow.appendChild(segmentName);

      let segmentDistance = document.createElement("td");
      let distanceinKM = data.segments[i].distance * 0.001;
      distanceinKM = (Math.round(distanceinKM * 100) / 100).toFixed(2);
      segmentDistance.textContent = distanceinKM + " Km";
      segmentDistance.setAttribute("class", "");
      newRow.appendChild(segmentDistance);

      let segmentGrade = document.createElement("td");
      segmentGrade.textContent = data.segments[i].avg_grade + " %";
      segmentGrade.setAttribute("class", "");
      newRow.appendChild(segmentGrade);

      let segmentElevation = document.createElement("td");
      segmentElevation.textContent = data.segments[i].elev_difference + " m";
      segmentElevation.setAttribute("class", "");
      newRow.appendChild(segmentElevation);

      //data to get degrees and direction from start-finish segment
      let lat1 = data.segments[i].start_latlng[0];
      let lon1 = data.segments[i].start_latlng[1];
      let lat2 = data.segments[i].end_latlng[0];
      let lon2 = data.segments[i].end_latlng[1];
      angleFromCoordinate(lat1, lon1, lat2, lon2, newRow);
      newRow.setAttribute(
        "data",
        JSON.stringify({
          start: data.segments[i].start_latlng,
          end: data.segments[i].end_latlng,
        })
      );
      newRow.addEventListener("mouseover", createRoute);
    }
    ////console.log(data);
  } else {
    //console.log(
      //"No segments to display in this area. Please select a different area"
    //);
  }
}

function cleanScreen() {
  if (!segmentRow.firstChild) {
    return;
  } else {
    while (segmentRow.firstChild) {
      segmentRow.removeChild(segmentRow.firstChild);
    }
  }
}
//Function to get degrees from coordinates
function angleFromCoordinate(lat1, lon1, lat2, lon2, newRow) {
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (lon1 * Math.PI) / 180;
  const λ2 = (lon2 * Math.PI) / 180;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  const brng = ((θ * 180) / Math.PI + 360) % 360; // in degrees

  avgDirectionSegment = document.createElement("td");
  avgDirectionSegment.textContent = getDirection(brng);
  newRow.appendChild(avgDirectionSegment);

  ////console.log(brng)
  getDirection(brng);
  ////console.log(getDirection(brng))
}

function getDirection(brng) {
  var directions = [
    "North",
    "North-East",
    "East",
    "South-East",
    "South",
    "South-West",
    "West",
    "North-West",
  ];
  var index = Math.round(((brng %= 360) < 0 ? brng + 360 : brng) / 45) % 8;
  return directions[index];
}

fetchStravaData();

function fetchWeatherData(latitude, longitude) {
  
  let apiUrl ='https://api.openweathermap.org/data/2.5/onecall?lat='+latitude+'&units=metric&lon='+longitude+'&appid=f8ed10bf86bf8687536af3bbc547d2af';
  ////console.log(apiUrl);
  fetch(apiUrl)
    .then(function (response) {
      if (response.ok) {
        //console.log(response);
        response.json().then(function (data) {
          //console.log(data);
          displayWeather(data);
        });
      } else {
        //console.log("Error: " + response.statusText);
        return;
      }
    })
    .catch(function (error) {
      //console.log("unable to connect with Strava API");
      return;
    });
}


function displayWeather(data){
  CleanScreenWeather()

  weatherDisplay.setAttribute("class", "weather-container");

  let currentWeatherTitle = document.createElement("h3")
  currentWeatherTitle.textContent = "Current Weather Display";
  currentWeatherTitle.setAttribute("class", "underline");
  weatherDisplay.appendChild(currentWeatherTitle)

  let cityTitle = document.createElement("h4");
  cityTitle.textContent = data.timezone;
  cityTitle.setAttribute("class", "m");
  weatherDisplay.appendChild(cityTitle);

  let dateUnix = data.current.dt;
  let dateCalendar = new Date(dateUnix*1000);

  let dateDisplay = document.createElement("h5");
  dateDisplay.textContent = dateCalendar.toLocaleDateString("en-GB");
  dateDisplay.setAttribute("class", "");
  weatherDisplay.appendChild(dateDisplay);

  let windValue = document.createElement("p")
  windValue.textContent = "Wind Speed: " + data.current.wind_speed + " Km/h";
  windValue.setAttribute("class", "")
  weatherDisplay.appendChild(windValue)

  let windDirection = document.createElement("p")
  let windDirectionValue = data.current.wind_deg
  windDirection.textContent = "Wind Direction: " + degToCompass(windDirectionValue)
  windDirection.setAttribute("class", "")
  weatherDisplay.appendChild(windDirection)
  degToCompass(windDirectionValue)

  let forecastWeatherTitle = document.createElement("h3")
  forecastWeatherTitle.textContent = "Tomorrow's Weather Display";
  forecastWeatherTitle.setAttribute("class", "underline");
  weatherDisplay.appendChild(forecastWeatherTitle)

  let dateUnixForecast = data.daily[1].dt;
  let dateCalendarForecast = new Date(dateUnixForecast*1000);

  let dateDisplayForecast = document.createElement("h5");
  dateDisplayForecast.textContent = dateCalendarForecast.toLocaleDateString("en-GB");
  dateDisplayForecast.setAttribute("class", "");
  weatherDisplay.appendChild(dateDisplayForecast);

  let windValueForecast = document.createElement("p")
  windValueForecast.textContent = "Wind Speed: " + data.current.wind_speed + " Km/h";
  windValueForecast.setAttribute("class", "")
  weatherDisplay.appendChild(windValueForecast)

  let windDirectionForecast = document.createElement("p")
  let windDirectionValueForecast = data.daily[1].wind_deg;
  //console.log(windDirectionValueForecast)
  windDirectionForecast.textContent = "Wind Direction: " + degToCompassForecast(windDirectionValueForecast)
  windDirectionForecast.setAttribute("class", "")
  weatherDisplay.appendChild(windDirectionForecast)
  
  degToCompassForecast(windDirectionValueForecast)
}

function degToCompass(windDirectionValue) {
  var val = Math.floor((windDirectionValue / 22.5) + 0.5);
  var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
}

function degToCompassForecast(windDirectionValueForecast) {
  var val = Math.floor((windDirectionValueForecast / 22.5) + 0.5);
  var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
}



function CleanScreenWeather(){
  if(!weatherDisplay.firstChild){
    return
}
else{
    while(weatherDisplay.firstChild){
        weatherDisplay.removeChild(weatherDisplay.firstChild)
    }
}
}