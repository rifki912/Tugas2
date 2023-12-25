window.onload = init;

function init() {
  // New Map
  const catCenterCoordinates = ol.proj.transform(
    [101.41715376909353, 0.4632355113167231],
    'EPSG:4326',
    'EPSG:3857'
  );
  const map = new ol.Map({
    view: new ol.View({
      center: catCenterCoordinates,
      zoom: 13,
    }),
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
    ],
    target: 'openlayers-map',
  });

  // data GeoJSON
  const markerStyle = (feature) => {
    const styles = [
      new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 1],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          opacity: 0.75,
          scale: 0.08,
          src: 'red.png'
        }),
      }),
    ];
  
    return styles;
  };
  
  const styleForSelect = (feature) => {
    const styles = [
      new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 1],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          opacity: 0.75,
          scale: 0.08,
          src: 'blue.png'
        }),
      }),
    ];
  
    return styles;
  };

  const tkLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
      format: new ol.format.GeoJSON(),
      url: './data/data.geojson',
    }),
    style: markerStyle,
  });
  map.addLayer(tkLayer);

  // Map Features Click Logic
  const navElements = document.querySelector('.column-navigation');
  navElements.addEventListener('mouseleave', () => {
    resetMapStyle();
  });
  const tkNameElement = document.getElementById('idname');
  const tkImageElement = document.getElementById('idimage');
  const tkDeskripsiElement = document.getElementById('iddeskripsi');
  const tkAddressElement = document.getElementById('idaddres');
  const tkNumberElement = document.getElementById('idnumber');
  
  const mapView = map.getView();

  // Fungsi untuk membuat tautan navigasi dinamis
  const createNavLinks = (features) => {
    features.forEach((feature) => {
      const idName = feature.get('name');
      const tkID = feature.get('id');
      const link = document.createElement('a');
      link.setAttribute('id', `idLink-${tkID}`);
      link.title = idName;
      link.innerHTML = `<i class="fa-regular fa-circle" id="${tkID}"></i>`;
      link.addEventListener('mouseenter', (e) => {
        mainLogic(feature, e.currentTarget);
      });
      link.addEventListener('click', (e) => {
        mainLogic(feature, e.currentTarget);
      });
      navElements.appendChild(link);
    });
  };
  
  navElements.addEventListener('mouseleave', () => {
    resetMapStyle();
  });
  
  
  
  const resetMapStyle = () => {
    let tkFeatures = tkLayer.getSource().getFeatures();
    tkFeatures.forEach((feature) => {
      feature.setStyle(markerStyle);
    });
  };

  // Ambil fitur dari GeoJSON dan buat tautan navigasi
  const tkFeatures = tkLayer.getSource().getFeatures();
  createNavLinks(tkFeatures);

  map.on('singleclick', (evt) => {
    map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      let featureName = feature.get('name');
      let navElement = navElements.children.namedItem(featureName);
      mainLogic(feature, navElement);
    });
  });

  const mainLogic = (feature, clickedAnchorElement) => {

    // Re-assign active class to the clicked element
    let currentActiveStyledElement = document.querySelector('.active');

    if (currentActiveStyledElement) {
      currentActiveStyledElement.classList.remove('active');
    }

    if (clickedAnchorElement && !clickedAnchorElement.classList.contains('active')) {
      clickedAnchorElement.classList.add('active');
    }

    // Default Style for all features
    resetMapStyle();

    feature.setStyle(styleForSelect);

    // Home Element: Change content in the menu to HOME
    if (clickedAnchorElement && clickedAnchorElement.id === 'Home') {
      // Home anchor clicked
      mapView.animate({ center: catCenterCoordinates }, { zoom: 13 });
  
      // Update information for Home
      tkNameElement.innerHTML = 'Peta Informasi Lokasi Tk di Pekanbaru';
      tkImageElement.setAttribute('src', './data/images/peta.jpg');
      tkImageElement.style.border = '1px solid black'; // Add border to the image
      tkDeskripsiElement.innerHTML = ''; // Set deskripsi ke nilai kosong
      tkAddressElement.innerHTML = ''; // Set alamat ke nilai kosong
      tkNumberElement.innerHTML = '';
  } else if (clickedAnchorElement) {
      // Another anchor clicked
      feature.setStyle(styleForSelect);
      let featureCoordinates = feature.getGeometry().getCoordinates();
      
      // Zoom in and center on the selected feature
      mapView.animate({ center: featureCoordinates }, { zoom: 18 });
  
      // Get information about the selected feature
      let featureName = feature.get('name');
      let featureAddress = feature.get('address');
      let featureImage = feature.get('image');
      let featureDeskripsi = feature.get('deskripsi');
      let featureNumber = feature.get('number');
  
      // Update HTML content based on the selected feature
      tkNameElement.innerHTML = featureName;
      tkImageElement.setAttribute('src', `./data/images/${featureImage}.jpg`);
      tkImageElement.style.border = '1px solid black'; // Add border to the image
      tkDeskripsiElement.innerHTML = featureDeskripsi;
      tkAddressElement.innerHTML = `<b>Alamat:</b> ${featureAddress}`;
      tkNumberElement.innerHTML = `<b>Telepon:</b> ${featureNumber}`;
  }
  };

  // Navigation Button Logic
  const anchorNavElements = document.querySelectorAll(".column-navigation > a");
  for (let anchorNavElement of anchorNavElements) {
    anchorNavElement.addEventListener("click", (e) => {
      let clickedAnchorElement = e.currentTarget;
      let clickedAnchorElementID = clickedAnchorElement.id;
      console.log(clickedAnchorElementID);
      let tkFeatures = tkLayer
        .getSource()
        .getFeatures();
      tkFeatures.forEach((feature) => {
        let featureidName = feature.get("name");
        if (clickedAnchorElementID === featureidName) {
          mainLogic(feature, clickedAnchorElement);
        }
        //console.log(feature.get("name"));
        // Home Navigation Case
        if (clickedAnchorElementID === "Home") {
          mainLogic(feature, clickedAnchorElement);
        }
      });
    });
  }

  // Features Hover Logic
  const popoverTextElement = document.getElementById("popover-text");
  const popoverTextLayer = new ol.Overlay({
    element: popoverTextElement,
    positioning: "bottom-center",
    stopEvent: false,
  });
  map.addOverlay(popoverTextLayer);

  map.on("pointermove", (evt) => {
    let isFeatureAtPixel = map.hasFeatureAtPixel(evt.pixel);
    if (isFeatureAtPixel) {
      let featureAtPixel = map.getFeaturesAtPixel(evt.pixel);
      let featureName = featureAtPixel[0].get("name");
      popoverTextLayer.setPosition(evt.coordinate);
      popoverTextElement.innerHTML = featureName;
      map.getViewport().style.cursor = "pointer";
    } else {
      popoverTextLayer.setPosition(undefined);
      map.getViewport().style.cursor = "";
    }
  });
}