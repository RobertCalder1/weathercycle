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

map.addEventListener("mapviewchange", function () {
  var mapView = map.getViewModel();
  var mapCorners = mapView.b.bounds.cb.X;
  var corners = [mapCorners[9], mapCorners[10], mapCorners[3], mapCorners[4]];
  console.log(corners);
  getSegmentTop10Data(corners)
});

moveMapToMelbourne(map);

//function to get top 10 segments in the area.
function getSegmentTop10Data (corners){
  let apiUrl = "https://www.strava.com/api/v3/segments/explore?bounds=" + corners + "&activity_type=riding&min_cat=0&max_cat=5" ;
  fetch(apiUrl, {
      method:"GET",
      headers: {
          "Authorization": "Bearer 960309002a72d8c155f02fae8b8a517426d0543a ",
          "Content-Type": "application/json"
      }
  })
  .then(response => response.json())
  .then(function (data){
    console.log(data)  
  })
}





