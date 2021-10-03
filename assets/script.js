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

function getMapCorners() {
  var mapView = map.getViewModel();
  var mapCorners = mapView.b.bounds.cb.X;
  corners = [mapCorners[9], mapCorners[10], mapCorners[3], mapCorners[4]];
  console.log(corners);
}

function checkCornersValue() {
  var mapView = map.getViewModel();
  var mapCorners = mapView.b.bounds.cb.X;
  checkCorners = [mapCorners[9], mapCorners[10], mapCorners[3], mapCorners[4]];
  console.log(checkCorners);
}
function waitTenSeconds() {
  checkCornersValue();
  if (corners !== checkCorners) {
    getMapCorners();
  } else {
    return;
  }
  setTimeout(waitTenSeconds, 2500);
}

waitTenSeconds();
