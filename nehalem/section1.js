mapboxgl.accessToken = 'pk.eyJ1IjoiaWZvcm1haGVyIiwiYSI6ImNsaHBjcnAwNDF0OGkzbnBzZmUxM2Q2bXgifQ.fIyIgSwq1WWVk9CKlXRXiQ';

var map1 = new mapboxgl.Map({
    container: 'map1',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: [-123.564, 45.971],
    zoom: 6
});

map1.on('load', () => {
    map1.fitBounds([
        [-124.538, 45.326],
        [-122.650, 46.131]
    ]);

    fetch('data/fill/Nehalem_HUC6.geojson')
      .then(response => response.json())
      .then(basinsdata => {
          map1.addSource('basins', {
              type: 'geojson',
              data: basinsdata
          });

          map1.addLayer({
              'id': 'basins',
              'type': 'line',
              'source': 'basins',
              'paint': {
                  'line-color': '#ebe9e8',
                  'line-width': 2.5
              }
          });
      });

    fetch('data/line/FHD_Coho_6_21.geojson')
      .then(response => response.json())
      .then(riversdata => {
          map1.addSource('rivers', {
              type: 'geojson',
              data: riversdata
          });

          map1.addLayer({
              'id': 'rivers',
              'type': 'line',
              'source': 'rivers',
              'paint': {
                  'line-color': '#6190ff',
                  'line-width': 1.5
              }
          });
      });

      fetch('data/circle/poi.geojson')
      .then(response => response.json())
      .then(poidata => {
          poidata.features.forEach(feature => {
              const { OBJECTID, Description } = feature.properties;
              const popupContent = `
                  <div style="text-align: center;">
                      <img src="images/poi/${OBJECTID}.png" 
                          alt="Image for ${OBJECTID}" 
                          style="width: 200px; max-width: 100%; height: auto;">
                      <p>${Description}</p>
                  </div>
              `;

              new mapboxgl.Marker()
                  .setLngLat(feature.geometry.coordinates)
                  .setPopup(new mapboxgl.Popup({ offset: 25 })
                      .setHTML(popupContent))
                  .addTo(map1);
          });
      });
});

function createSec1Slide(slide, sidebarId) {
    var sidebarSlide = document.createElement('div');
    sidebarSlide.className = 'slide1';
    sidebarSlide.setAttribute('name', slide.title);
    slideID = "slide" + slide.id
    sidebarSlide.setAttribute('id', slideID);
    sidebarSlide.setAttribute('background-image', slide.image1);
    sidebarSlide.innerHTML = `
        <h2>${slide.title}</h2>
        <p>${slide.description}</p>
    `;

    var isMobile = window.innerWidth <= 768;

    if (isMobile) {
        sidebarSlide.style.left = "5%";
        sidebarSlide.style.right = ";"
    } else {
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
    }
    
    document.getElementById(sidebarId).appendChild(sidebarSlide);
}

function changeBackground(sidebarID, imageID) {
    const sidebar = document.getElementById(sidebarID);
    const image = document.getElementById(imageID);
    const slides = sidebar.getElementsByClassName('slide1');
    const map1 = document.getElementById('map1');
    let lastActiveSlide = null;
    let isTransitioning = false;
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function updateBackground(backgroundImage) {
        if (isTransitioning) return;
        isTransitioning = true;
        
        image.classList.add('fade-out');
        setTimeout(() => {
            image.style.backgroundImage = `url(${backgroundImage})`;
            image.classList.remove('fade-out');
            isTransitioning = false;
        }, 200);
    }

    const handleScroll = debounce(() => {
        let mostVisibleSlide = null;
        let maxVisibility = 0.8;

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const slideBox = slide.getBoundingClientRect();
            const sidebarRect = sidebar.getBoundingClientRect();
            
            const visibleHeight = Math.min(slideBox.bottom, sidebarRect.bottom) -
                                Math.max(slideBox.top, sidebarRect.top);
            const visiblePercentage = visibleHeight / slideBox.height;

            if (visiblePercentage > maxVisibility) {
                maxVisibility = visiblePercentage;
                mostVisibleSlide = slide;
            }
        }

        if (mostVisibleSlide && mostVisibleSlide !== lastActiveSlide) {
            if (mostVisibleSlide.id === "slide5") {
                map1.classList.add('active');
                sidebar.style.pointerEvents = "none";
            } else {
                const backgroundImage = mostVisibleSlide.getAttribute('background-image');
                if (image.style.backgroundImage !== `url(${backgroundImage})`) {
                    updateBackground(backgroundImage);
                    lastActiveSlide = mostVisibleSlide;
                    map1.classList.remove('active');
                    sidebar.style.pointerEvents = "auto";
                }
            }
        }
    }, 50);

    sidebar.addEventListener('scroll', handleScroll);
}

function populateSection1(data) {
    data.forEach(function(slide) {
        const sidebarID = "sidebar1";
        const imageID = "image1";
       
        createSec1Slide(slide, sidebarID);
        console.log(`Slide ${slide.id} created`);
    });
    
    changeBackground("sidebar1", "image1");
}

document.addEventListener('DOMContentLoaded', function() {
    fetch('data/section1.json')
        .then(response => response.json())
        .then(data => {
            populateSection1(data);
        })
        .catch(error => console.error('Error fetching or parsing JSON:', error));
});

document.addEventListener("DOMContentLoaded", function () {
    const sidebar1 = document.getElementById("sidebar1");
    const toggleBtn1 = document.getElementById("sidebar1-switch");

    toggleBtn1.addEventListener("click", function () {
        sidebar1.classList.toggle("collapsed");
        toggleBtn1.textContent = sidebar1.classList.contains("collapsed") ? ">>" : "<<";
    });
});