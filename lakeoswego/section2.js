let paintSettings = {};

fetch('paintSettings.json')
  .then(response => response.json())
  .then(data => {
    paintSettings = data;
  })
  .catch(error => console.error('Error loading paint settings:', error));

mapboxgl.accessToken = 'pk.eyJ1IjoiaWZvcm1haGVyIiwiYSI6ImNsaHBjcnAwNDF0OGkzbnBzZmUxM2Q2bXgifQ.fIyIgSwq1WWVk9CKlXRXiQ';

var map2 = new mapboxgl.Map({
  container: 'map2',
  style: 'mapbox://styles/iformaher/clic1xztq00da01o7fhm6bofw',
  center: [-122.90394489584305, 45.454840405738],
  zoom: 9
});

let currentLayers = ["data/points/OakPoints.geojson"];
let layersToAdd = [];
let layersToDelete = [];

function createSlide2(slide, sidebarId) {
    var sidebarSlide = document.createElement('div');
    sidebarSlide.className = 'slide';
    sidebarSlide.setAttribute('name', slide.title);
    sidebarSlide.setAttribute('data-layer1', slide.layer1);
    sidebarSlide.setAttribute('data-layer2', slide.layer2 || '');
    sidebarSlide.setAttribute('data-layer3', slide.layer3 || '');
    sidebarSlide.setAttribute('coordinates', slide.coordinates);
    sidebarSlide.setAttribute('zoom', slide.zoom);

    sidebarSlide.innerHTML = `
    <h2>${slide.title}</h2>
    <p>${slide.description}</p>
    `;

    if (slide.sidebarPosition === "center") {
        sidebarSlide.style.left = "50%";
        sidebarSlide.style.transform = "translateX(-50%)";
    } else if (slide.sidebarPosition === "right") {
        sidebarSlide.style.left = "";
        sidebarSlide.style.right = "-65%"; 
    } else {
        sidebarSlide.style.right = "";
        sidebarSlide.style.left = "5%";  
    }
      
    document.getElementById(sidebarId).appendChild(sidebarSlide);
}

function updateLayersLists(currentLayersArray, slide) {
  const requiredLayers = [];

  const layer1 = slide.getAttribute('data-layer1');
  if (layer1) requiredLayers.push(layer1);

  const layer2 = slide.getAttribute('data-layer2');
  if (layer2) requiredLayers.push(layer2);

  const layer3 = slide.getAttribute('data-layer3');
  if (layer3) requiredLayers.push(layer3);

  const requiredLayersSet = new Set(requiredLayers);
  const currentLayersSet = new Set(currentLayersArray);

  const layersToDelete = [...currentLayersSet].filter(layer => !requiredLayersSet.has(layer));
  const layersToAdd = [...requiredLayersSet].filter(layer => !currentLayersSet.has(layer));

  return {
    requiredLayers,
    layersToDelete,
    layersToAdd
  };
}

map2.on('load', () => {
  map2.addSource('OakPoints', {
    type: 'geojson',
    data: 'data/circle/OakPoints.geojson'
  });

  map2.addLayer({
    'id': 'OakPoints',
    'type': 'circle',
    'source': 'OakPoints',
    'paint': {
      'circle-radius': 2,
      'circle-stroke-width': 0.3,
      'circle-color': '#f724c7',
      'circle-stroke-color': 'black'
    }
  });
  
  console.log('Map loaded');
});

function addLayerToMap(layerPath) {
  const layerId = layerPath.split('/').pop().split('.')[0];

  fetch(layerPath)
    .then(response => response.json())
    .then(data => {
      if (!map2.getSource(layerId)) {
        map2.addSource(layerId, {
          type: 'geojson',
          data: data
        });
      }

      if (!map2.getLayer(layerId)) {
        const paint = paintSettings[layerId] || {};
        if (!paint) {
          console.error(`No paint settings for ${layerId}`);
          return;
        }

        const layerType = layerPath.includes('circle') ? 'circle':'fill';

        map2.addLayer({
          'id': layerId,
          'type': layerType,
          'source': layerId,
          'paint': paint
        });
      } else console.log("Cannot locate layer")
    })
    .catch(error => {
      console.error('Error loading layer:', layerPath, error);
    });
}

function mapSlideUpdate(slide) {
  const { requiredLayers, layersToDelete, layersToAdd } = updateLayersLists(currentLayers, slide);
  
  layersToAdd.forEach(function(layer) {
    addLayerToMap(layer);
  });
  
  layersToDelete.forEach(function(layer) {
    const layerId = layer.split('/').pop().split('.')[0];
    if (map2.getLayer(layerId)) {
      map2.removeLayer(layerId);
    }
    if (map2.getSource(layerId)) {
      map2.removeSource(layerId);
    }
  });

  currentLayers = [...requiredLayers];
  
  const coordinates = JSON.parse(slide.getAttribute('coordinates'));
  const zoom = parseFloat(slide.getAttribute('zoom'));

  map2.flyTo({
    center: coordinates,
    zoom: zoom,
    essential: true 
  });
}

function changeLayersWithObserver(sidebarID, mapID) {
  const sidebar = document.getElementById(sidebarID);
  const slides = sidebar.getElementsByClassName('slide');

  const threshold = window.innerWidth < 768 ? 0.5 : 0.8;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const slide = entry.target;
          const index = Array.prototype.indexOf.call(slides, slide);

          let newStyle = null;
          if (index === 5) {
            newStyle = 'mapbox://styles/mapbox/standard-satellite';
          } else if (index === 7) {
            newStyle = 'mapbox://styles/iformaher/clic1xztq00da01o7fhm6bofw';
          }

          if (newStyle) {            
            map2.setStyle(newStyle);

            map2.once('styledata', () => {
              mapSlideUpdate(slide);
            });
          } else {
            mapSlideUpdate(slide);
          }
        }
      });
    },
    {
      root: sidebar,
      threshold: threshold,
    }
  );

  Array.from(slides).forEach((slide) => observer.observe(slide));
}

function populateSection2(data) {
  data.forEach(function(slide) {
    const sidebarID = "sidebar2";
    const mapID = 'map2';
    
    createSlide2(slide, sidebarID);
    console.log(`Slide ${slide.id} created`);

    changeLayersWithObserver(sidebarID, mapID);
  });
}

document.querySelectorAll('.info-button').forEach(icon => {
  icon.addEventListener('click', function (e) {
    this.classList.toggle('active');

    document.querySelectorAll('.info-icon').forEach(otherIcon => {
      if (otherIcon !== this) {
        otherIcon.classList.remove('active');
      }
    });

    e.stopPropagation();
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('info-icon').forEach(icon => {
    icon.classList.remove('active');
  })
})

document.addEventListener('DOMContentLoaded', function() {
  fetch('section2.json')
      .then(response => response.json())
      .then(data => {
          populateSection2(data);
      })
      .catch(error => console.error('Error fetching or parsing JSON:', error));
});