require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/widgets/Search",
    "esri/widgets/Legend",
    "esri/widgets/Expand",
    "esri/Graphic",
    "esri/widgets/NavigationToggle",
    "esri/rest/support/Query",
    "esri/geometry/Point",
    "esri/geometry/geometryEngine",
    "esri/geometry/Extent"
], function(Map, MapView, FeatureLayer, Search, Legend, Expand, Graphic, NavigationToggle, Query, Point, geometryEngine, Extent) {

    console.log("✅ ArcGIS Modules Loaded!");

    // Create Map
    const map = new Map({
        basemap: "streets-navigation-vector"
    });

    // ✅ Set an Initial Extent for Marin County (Fix Default Zoom)
    const initialExtent = new Extent({
        xmin: -123.2,
        ymin: 37.8,
        xmax: -122.3,
        ymax: 38.3,
        spatialReference: { wkid: 4326 }
    });

    // ✅ Create MapView (Start with a Good Default Zoom)
    const view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-122.7100, 38.0521], // Default Center (Marin County)
        zoom: 9 // Default Zoom Level (not too far, not too close)
    });

    view.when(() => {
        console.log("✅ Map Loaded Successfully!");
    }).catch(error => {
        console.error("❌ Map Load Error:", error);
    });

    // ✅ Feature Layers (Initially Hidden)
    const parcelLayer = new FeatureLayer({
        url: "https://services6.arcgis.com/T8eS7sop5hLmgRRH/arcgis/rest/services/Parcels/FeatureServer/0",
        outFields: ["*"],
        spatialReference: { wkid: 4326 },
        title: "Parcels",
        visible: false
    });
    map.add(parcelLayer);

    const zoningLayer = new FeatureLayer({
        url: "https://services6.arcgis.com/T8eS7sop5hLmgRRH/arcgis/rest/services/Zoning_of_Unincorporated_Marin_County/FeatureServer/0",
        outFields: ["*"],
        spatialReference: { wkid: 4326 },
        title: "Zoning",
        visible: false
    });
    map.add(zoningLayer);

    const generalPlanLayer = new FeatureLayer({
        url: "https://services6.arcgis.com/T8eS7sop5hLmgRRH/arcgis/rest/services/General_Plan_of_Unincorporated_Marin_County/FeatureServer/0",
        outFields: ["*"],
        spatialReference: { wkid: 4326 },
        title: "General Plan",
        visible: false
    });
    map.add(generalPlanLayer);

    // ✅ Move ArcGIS Search Widget into Sidebar (Full Width)
    const searchWidget = new Search({ 
        view: view, 
        container: "searchWidget"
    });

    // ✅ Resize Search Box to Fit Sidebar
    document.getElementById("searchWidget").style.width = "100%";

    // ✅ Handle Search Selection
    searchWidget.on("select-result", function(event) {
        let location = event.result.feature.geometry;
        console.log("🔍 Search result selected:", location);
        processPoint(location, true);
    });

    // ✅ Legend Widget
    const legend = new Legend({ view: view });
    const legendExpand = new Expand({ view: view, content: legend, expanded: false });
    view.ui.add(legendExpand, "bottom-left");

    // ✅ Navigation Toggle (Unlock Panning/Zooming)
    const navigationToggle = new NavigationToggle({ view: view });
    view.ui.add(navigationToggle, "top-left");

    // ✅ Handle Map Clicks for Intersection & Sidebar Update
    view.on("click", function(event) {
        console.log("🖱 Map clicked at:", event.mapPoint);
        processPoint(event.mapPoint, false);
    });

    // ✅ Function to Process Point (Click or Search) & Zoom Correctly
    function processPoint(point, isFromSearch) {
        console.log("📍 Processing point:", point);

        // Place marker at the point
        let pointGraphic = new Graphic({
            geometry: point,
            symbol: { type: "simple-marker", color: "red", size: "10px" }
        });

        view.graphics.removeAll();
        view.graphics.add(pointGraphic);

        // ✅ Unified Intersection Logic for ALL Layers (Parcels, Zoning, General Plan)
        checkIntersection(point, isFromSearch);
    }

    // ✅ Check Intersection Function (Unified for ALL Layers + Zooming)
    function checkIntersection(point, isFromSearch) {
        console.log("🔍 Checking intersection for:", point);

        let layersToCheck = [parcelLayer, zoningLayer, generalPlanLayer];
        let promises = layersToCheck.map(layer => {
            let query = layer.createQuery();
            query.geometry = point;
            query.spatialRelationship = "intersects";
            query.returnGeometry = true;
            query.outFields = ["*"];

            return layer.queryFeatures(query)
                .then(results => {
                    console.log(`🟢 ${layer.title} returned ${results.features.length} features.`);

                    // ✅ Return the **smallest intersecting polygon** (most relevant)
                    let smallestFeature = results.features.length > 0
                        ? results.features.reduce((smallest, feature) =>
                            !smallest || feature.geometry.extent.width * feature.geometry.extent.height < 
                            smallest.geometry.extent.width * smallest.geometry.extent.height ? feature : smallest
                        )
                        : null;

                    return { layer: layer, layerName: layer.title, feature: smallestFeature };
                })
                .catch(error => {
                    console.error(`❌ Query Error for ${layer.title}:`, error);
                    return { layer: layer, layerName: layer.title, feature: null };
                });
        });

        Promise.all(promises).then(results => {
            let sidebarContent = `<b>Intersected Features:</b><br>`;
            let hasIntersections = false;
            let zoomTarget = point; // Default zoom target is the clicked point

            results.forEach(result => {
                if (result.feature) {
                    hasIntersections = true;
                    sidebarContent += `<h3>${result.layerName}</h3><ul>`;

                    let feature = result.feature;

                    // ✅ Set zoom target to the parcel extent if found
                    if (result.layerName === "Parcels") {
                        zoomTarget = feature.geometry.extent;
                        sidebarContent += `<li><b>APN:</b> ${feature.attributes.Parcel || "N/A"} <br>`;
                    } else if (result.layerName === "Zoning") {
                        sidebarContent += `<li><b>Zoning:</b> ${feature.attributes.Zoning} <br>`;
                        sidebarContent += `<b>Description:</b> ${feature.attributes.ZoningDescription || "N/A"} <br>`;
                    } else if (result.layerName === "General Plan") {
                        sidebarContent += `<li><b>General Plan:</b> ${feature.attributes.GeneralPlan} <br>`;
                    }
                    sidebarContent += `</li></ul>`;
                }
            });

            document.getElementById("results").innerHTML = hasIntersections ? sidebarContent : "<p>No intersection found.</p>";

            // ✅ Zoom in correctly when clicking or searching
            if (zoomTarget !== point) {
                view.goTo(zoomTarget.expand(1.5)).then(() => updateLayerVisibility());
            } else if (isFromSearch) {
                view.goTo({ target: point, zoom: 17 }).then(() => updateLayerVisibility());
            } else {
                view.goTo({ target: point, zoom: 15 }).then(() => updateLayerVisibility());
            }
        });
    }

    // ✅ Watch for Zoom Changes to Update Layer Visibility
    view.watch("scale", updateLayerVisibility);

    function updateLayerVisibility() {
        let currentScale = view.scale;
        let showLayers = currentScale < 36000; // Adjust visibility threshold
        parcelLayer.visible = showLayers;
        zoningLayer.visible = showLayers;
        generalPlanLayer.visible = showLayers;
    }
});
