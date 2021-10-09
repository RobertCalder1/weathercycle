var segmentRow = document.getElementById("segment-row");
let windDirectionValueContentFrom ;
let windDirectionValueContentTo ;
var weatherDisplay = document.getElementById("weather-display")
var corners;
var checkCorners;
var searchBtn = document.querySelector(".search-button");
var searchBar = document.querySelector(".search-bar-input");
var newMarker;
var segmentStartCoordinates = [];
var segmentEndCoordinates = [];
var tableRow = document.getElementsByClassName("segment");
var accessToken="";

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
  var locations = result.items;
  var locationPosition = locations[0].position;
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

  var data = JSON.parse(elem.getAttribute("data"));
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

//fetch the Strava API key from refresh token
function fetchStravaDataSample() {
  let apiUrl =
    "https://www.strava.com/oauth/token"
  fetch(apiUrl, {
         method: 'post',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'

        },body: JSON.stringify({

          client_id: '71858',
          client_secret: '71a54d1b8ee4bf6130121c9544b5019459db5398',
          refresh_token: '0a94c7fed1f350c609ecc44307cd3757b730da4d',
          grant_type: 'refresh_token'
      })
    })
    .then(function (response) {
      if (response.ok) {
        response.json().then(function (data) {
          accessToken = data.access_token
        });
      } else {
        return;
      }
    })
    .catch(function (error) {
      return;
    });
}

fetchStravaDataSample()

//function to get data from Strava API
function fetchStravaData() {
  let apiUrl =
    "https://www.strava.com/api/v3/segments/explore?bounds=" + corners + "&activity_type=riding&min_cat=0&max_cat=5";
  fetch(apiUrl, {
    method: "GET",
    headers: {
      //Update key every 6 hours
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
  })
    .then(function (response) {
      if (response.ok) {
        response.json().then(function (data) {
          renderSegmentTable(data);
        });
      } else {
        return;
      }
    })
    .catch(function (error) {
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
      segmentRow.appendChild(newRow);

      let segmentName = document.createElement("td");
      segmentName.textContent = data.segments[i].name;
      newRow.appendChild(segmentName);

      let segmentDistance = document.createElement("td");
      let distanceinKM = data.segments[i].distance * 0.001;
      distanceinKM = (Math.round(distanceinKM * 100) / 100).toFixed(2);
      segmentDistance.textContent = distanceinKM + " Km";
      newRow.appendChild(segmentDistance);

      let segmentGrade = document.createElement("td");
      segmentGrade.textContent = data.segments[i].avg_grade + " %";
      newRow.appendChild(segmentGrade);

      let segmentElevation = document.createElement("td");
      segmentElevation.textContent = data.segments[i].elev_difference + " m";
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
      newRow.addEventListener("click", createRoute);
    }
  } else {
    return;
  }
}

//Remove old segments when updating the map
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
  newRow.appendChild(avgDirectionSegment);
  spanData = document.createElement("span")
  spanData.textContent = getDirection(brng);
  spanData.setAttribute("class", "segment-direction");
  //check that segment direction is within 90 degrees of the wind direction
  if (((brng >= windDirectionValueContentTo - 45) && (brng <= windDirectionValueContentTo +45)) || (brng === windDirectionValueContentTo)){
    spanData.style.backgroundColor = "#5ce65c";
  }
  else{
    spanData.style.backgroundColor = "#cccccc";
  }

  avgDirectionSegment.appendChild(spanData);

  getDirection(brng);
}

//get compass coordinate value for segment direction
function getDirection(brng) {
  var val = Math.floor((brng / 22.5) + 0.5);
  var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
}

//fetch weather data 
function fetchWeatherData(latitude, longitude) {
  let apiUrl ='https://api.openweathermap.org/data/2.5/onecall?lat='+latitude+'&units=metric&lon='+longitude+'&appid=f8ed10bf86bf8687536af3bbc547d2af';
  fetch(apiUrl)
    .then(function (response) {
      if (response.ok) {
        response.json().then(function (data) {
          displayWeather(data);
        });
      } else {
        return;
      }
    })
    .catch(function (error) {
      return;
    });
}


//function to display weather 
function displayWeather(data){
  CleanScreenWeather()

  weatherDisplay.setAttribute("class", "weather-container");

  let currentWeatherTitle = document.createElement("h3")
  currentWeatherTitle.textContent = "Current Wind Forecast";
  currentWeatherTitle.setAttribute("class", "underline");
  weatherDisplay.appendChild(currentWeatherTitle)

  let cityTitle = document.createElement("h4");
  cityTitle.textContent = data.timezone;
  cityTitle.setAttribute("class", "m");
  weatherDisplay.appendChild(cityTitle);

  let dateUnix = data.current.dt;
  let dateCalendar = new Date(dateUnix*1000);

  let dateDisplay = document.createElement("h4");
  dateDisplay.textContent = dateCalendar.toLocaleDateString("en-GB");
  weatherDisplay.appendChild(dateDisplay);

  let windDisplay = document.createElement("p")
  windValue = Math.round((data.current.wind_speed * 3.6) * 100) / 100
  windDisplay.textContent = "Wind Speed: " + windValue + " Km/h";
  weatherDisplay.appendChild(windDisplay)
  windBackgroundColor(windValue, windDisplay)

  let windDirection = document.createElement("p")
  windDirectionValueContentFrom = data.current.wind_deg
  windDirectionValueContentTo = data.current.wind_deg
  if (windDirectionValueContentTo <= 180){
    windDirectionValueContentTo = windDirectionValueContentTo + 180;
  }
  else {
    windDirectionValueContentTo = windDirectionValueContentTo -180;
  }
 
  windDirection.textContent = "Wind Direction: " + degToCompassFrom(windDirectionValueContentFrom) + " to " + degToCompassTo(windDirectionValueContentTo)
  weatherDisplay.appendChild(windDirection)
  degToCompassFrom(windDirectionValueContentFrom)
  degToCompassTo(windDirectionValueContentTo)

  let forecastWeatherTitle = document.createElement("h3")
  forecastWeatherTitle.textContent = "Tomorrow's Wind Forecast";
  forecastWeatherTitle.setAttribute("class", "underline");
  weatherDisplay.appendChild(forecastWeatherTitle)

  let dateUnixForecast = data.daily[1].dt;
  let dateCalendarForecast = new Date(dateUnixForecast*1000);

  let dateDisplayForecast = document.createElement("h4");
  dateDisplayForecast.textContent = dateCalendarForecast.toLocaleDateString("en-GB");
  weatherDisplay.appendChild(dateDisplayForecast);

  let windDisplayForecast = document.createElement("p")
  windValueForecast = Math.round((data.daily[1].wind_speed * 3.6) * 100) / 100
  windDisplayForecast.textContent = "Wind Speed: " + windValueForecast + " Km/h";
  weatherDisplay.appendChild(windDisplayForecast)
  windBackgroundColorForecast(windValueForecast, windDisplayForecast)

  let windDirectionForecast = document.createElement("p")
  let windDirectionValueForecast = data.daily[1].wind_deg;
  windDirectionForecast.textContent = "Wind Direction: " + degToCompassForecast(windDirectionValueForecast)
  weatherDisplay.appendChild(windDirectionForecast)
  
  degToCompassForecast(windDirectionValueForecast)
}

//print compass coordinate on current weather forecast 
function degToCompassFrom(brng) {
  var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  var index = Math.round(((brng %= 360) < 0 ? brng + 360 : brng) / 22.5) % 16;
  return arr[index];
}

//print compass coordinate on current weather forecast 
function degToCompassTo(brng) {
  var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  var index = Math.round(((brng %= 360) < 0 ? brng + 360 : brng) / 22.5) % 16;
  return arr[index];
}

//print compass coordinate on tomorrow's weather forecast 
function degToCompassForecast(windDirectionValueForecast) {
  var val = Math.floor((windDirectionValueForecast / 22.5) + 0.5);
  var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
}

//Change background color depending on the wind value on current weather forecast
function windBackgroundColor(windValue, windDisplay) {
  if(windValue < 15){
    windDisplay.style.backgroundColor = "#cccccc";
}else if(windValue < 35){
    windDisplay.style.backgroundColor = "#70db70";
}else{
    windDisplay.style.backgroundColor = "#ff7733";
}
}

//change background color on the wind value on tomorrow's weather forecast
function windBackgroundColorForecast(windValueForecast, windDisplayForecast){
  if(windValueForecast < 15){
    windDisplayForecast.style.backgroundColor = "#cccccc";
}else if(windValueForecast < 35){
    windDisplayForecast.style.backgroundColor = "#70db70";
}else{
    windDisplayForecast.style.backgroundColor = "#ff7733";
}
}

//clean screen on weather display
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
