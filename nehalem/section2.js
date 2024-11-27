mapboxgl.accessToken = 'pk.eyJ1IjoiaWZvcm1haGVyIiwiYSI6ImNsaHBjcnAwNDF0OGkzbnBzZmUxM2Q2bXgifQ.fIyIgSwq1WWVk9CKlXRXiQ';

let currentLayers = [];

const mapInstances = {};

function initializeMap(mapId, mapOptions) {
    mapInstances[mapId] = new mapboxgl.Map({
        container: mapId,
        style: mapOptions.style,
        bounds: mapOptions.bounds,
        zoom: mapOptions.zoom
    });
}

// Initialize each map with its specific options
initializeMap("data-map2", { style: "mapbox://styles/mapbox/satellite-streets-v11", bounds: [[-125, 45.52], [-122.93, 46.14]], zoom: 9 });
initializeMap("basin-map2", { style: "mapbox://styles/mapbox/dark-v11", bounds: [[-125, 45.52], [-122.93, 46.14]], zoom: 9 });
initializeMap("data-map3", { style: "mapbox://styles/mapbox/satellite-streets-v11", bounds: [[-125, 45.52], [-122.93, 46.14]], zoom: 9 });
initializeMap("basin-map3", { style: "mapbox://styles/mapbox/dark-v11", bounds: [[-125, 45.52], [-122.93, 46.14]], zoom: 9 });
initializeMap("data-map4", { style: "mapbox://styles/mapbox/satellite-streets-v11", bounds: [[-125, 45.52], [-122.93, 46.14]], zoom: 9 });
initializeMap("basin-map4", { style: "mapbox://styles/mapbox/dark-v11", bounds: [[-125, 45.52], [-122.93, 46.14]], zoom: 9 });


const sectionLayers = {};

function initializeLayerTracking(sectionId) {
    sectionLayers[sectionId] = {
        dataLayers: [],
        basinLayers: []
    };
}

function createSlide(slide, sidebarId) {
    const sidebarSlide = document.createElement('div');
    sidebarSlide.className = 'slide';
    
    // Set all necessary attributes for the maps
    sidebarSlide.setAttribute('id', slide.id);
    sidebarSlide.setAttribute('name', slide.title);
    sidebarSlide.setAttribute('data-layer', slide.dataLayer);
    sidebarSlide.setAttribute('basin-layer', slide.basinLayer);
    sidebarSlide.setAttribute('swCoordinate', slide.swCoordinate);
    sidebarSlide.setAttribute('neCoordinate', slide.neCoordinate);
    
    // Set data map attributes
    sidebarSlide.setAttribute('dataAttribute', slide.dataAttribute);
    sidebarSlide.setAttribute('dataNaming', slide.dataNaming);
    sidebarSlide.setAttribute('dataPaintType', slide.dataPaintType);
    sidebarSlide.setAttribute('dataSteps', JSON.stringify(slide.dataSteps));
    sidebarSlide.setAttribute('dataColors', JSON.stringify(slide.dataColors));
    sidebarSlide.setAttribute('dataLegend', `data-legend${slide.id}`);
    sidebarSlide.setAttribute('dataUnits', slide.dataUnits);
    
    // Set basin map attributes
    sidebarSlide.setAttribute('basinAttribute', slide.basinAttribute);
    sidebarSlide.setAttribute('basinNaming', slide.basinNaming);
    sidebarSlide.setAttribute('basinPaintType', slide.basinPaintType);
    sidebarSlide.setAttribute('basinSteps', JSON.stringify(slide.basinSteps));
    sidebarSlide.setAttribute('basinColors', JSON.stringify(slide.basinColors));
    sidebarSlide.setAttribute('basinLegend', `basin-legend${slide.id}`);
    sidebarSlide.setAttribute('basinUnits', slide.basinUnits);

    sidebarSlide.innerHTML = `
        <h2>${slide.title}</h2>
        <p class="source">Source: ${slide.source}</p>
        <div class="legend-container">
            <div id="data-legend${slide.id}" class="data-legend"></div>
            <div id="basin-legend${slide.id}" class="basin-legend"></div>
        </div>
    `;

    document.getElementById(sidebarId).appendChild(sidebarSlide);

    setTimeout(() => {
        createLegend(JSON.parse(sidebarSlide.getAttribute('dataSteps')), JSON.parse(sidebarSlide.getAttribute('dataColors')), sidebarSlide.getAttribute('dataLegend'), sidebarSlide.getAttribute('dataAttribute'), sidebarSlide.getAttribute('dataUnits'));
        createLegend(JSON.parse(sidebarSlide.getAttribute('basinSteps')), JSON.parse(sidebarSlide.getAttribute('basinColors')), sidebarSlide.getAttribute('basinLegend'), sidebarSlide.getAttribute('basinAttribute'), sidebarSlide.getAttribute('basinUnits'));
    }, 5);
}

function cleanupAllLayers(map) {
    const layers = map.getStyle().layers;
    layers.forEach(layer => {
        if (map.getLayer(layer.id)) {
            const source = map.getStyle().sources[layer.source];
            if (source && (source.type === 'geojson' || source.type === 'image')) {
                map.removeLayer(layer.id);
                if (map.getSource(layer.id)) {
                    map.removeSource(layer.id);
                }
            }
        }
    });
}

function mapSlideUpdate(slide, sectionId) {
    const dataMap = mapInstances[`data-map${sectionId}`];
    const basinMap = mapInstances[`basin-map${sectionId}`];

    cleanupAllLayers(basinMap);
    cleanupAllLayers(dataMap);

    const dataLayerConfig = {
        layerPath: slide.getAttribute('data-layer'),
        attribute: slide.getAttribute('dataAttribute'),
        naming: slide.getAttribute('dataNaming'),
        paintType: slide.getAttribute('dataPaintType'),
        steps: JSON.parse(slide.getAttribute('dataSteps')),
        colors: JSON.parse(slide.getAttribute('dataColors')),
        units: slide.getAttribute('dataUnits'),
    };

    const basinLayerConfig = {
        layerPath: slide.getAttribute('basin-layer'),
        attribute: slide.getAttribute('basinAttribute'),
        naming: slide.getAttribute('basinNaming'),
        paintType: slide.getAttribute('basinPaintType'),
        steps: JSON.parse(slide.getAttribute('basinSteps')),
        colors: JSON.parse(slide.getAttribute('basinColors')),
        units: slide.getAttribute('basinUnits')
    };

    sectionLayers[sectionId].dataLayers = updateMapLayers(dataMap, sectionLayers[sectionId].dataLayers, dataLayerConfig);
    sectionLayers[sectionId].basinLayers = updateMapLayers(basinMap, sectionLayers[sectionId].basinLayers, basinLayerConfig);
}

function createLegend(steps, colors, containerId, attribute, units) {
    const legendContainer = document.getElementById(containerId);

    if (!legendContainer) {
        console.error(`Legend container with ID ${containerId} not found.`);
        return;
    }

    legendContainer.innerHTML = ''; 
    
    const legendTitle = document.createElement('h3');
    legendTitle.className = 'legend-title';

    const roundedAttribute = (typeof attribute === 'number') 
        ? attribute.toFixed(2) 
        : attribute;

    legendTitle.innerText = `${roundedAttribute} ${units ? '(' + units + ')' : ''}`;
    legendContainer.appendChild(legendTitle);
    
    steps.forEach((step, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';

        const colorBox = document.createElement('span');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = colors[index];

        const label = document.createElement('span');
        label.className = 'legend-label';
        label.innerText = `${step}`;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);
    });
}

function updateMapLayers(map, currentLayers, newLayerConfig) {
    if (!newLayerConfig) {
        console.warn('No layer configuration provided');
        return currentLayers;
    }

    const { layerPath, attribute, paintType, steps, colors, naming, units } = newLayerConfig;
    const layerType = layerPath.split("/")[1];

    if (layerPath) {
        if (layerType === "raster") {
            addRasterToMap(map, layerPath, paintType);
        } else {
            addLayerToMap(map, layerPath, layerType, attribute, paintType, steps, colors, naming, units);
        }
        return [layerPath];
    }
    return [];
}

function addLayerToMap(map, layerPath, layerType, attribute, paintType, steps, colors, naming, units) {
    const layerId = layerPath.split('/').pop().split('.')[0];

    fetch(layerPath)
        .then(response => response.json())
        .then(data => {
        if (!map.getSource(layerId)) {
                map.addSource(layerId, {
                    type: 'geojson',
                    data: data
                });
            }

            if (!map.getLayer(layerId)) {
                const paint = getPaintSettings(layerPath, attribute, paintType, steps, colors);
                
                map.addLayer({
                    'id': layerId,
                    'type': layerType,
                    'source': layerId,
                    'paint': paint
                });

                addPopupToLayer(map, layerId, attribute, naming, units);
            }
        })
            
        .catch(error => {
            console.error('Error loading layer:', layerPath, error);
        });
}

function parseCoordinates(coordinates) {
    const values = coordinates.split(',');

    const coordArray = [];
    for (let i = 0; i < values.length; i += 2) {
        const lon = parseFloat(values[i]);
        const lat = parseFloat(values[i + 1]);
        coordArray.push([lon, lat]);
    }

    return coordArray;
}

function addRasterToMap(map, layerPath, coordinates) {
    const rasterId = layerPath.split('/').pop().split('.')[0];
    const coordArray = parseCoordinates(coordinates);

    if (!map.getSource(rasterId)) {
        map.addSource(rasterId, {
            type: 'image',
            url: layerPath,
            coordinates: coordArray
        });

        map.on('sourcedata', function checkSourceLoaded(e) {
            if (e.sourceId === rasterId && map.isSourceLoaded(rasterId)) {
                map.off('sourcedata', checkSourceLoaded);
                
                if (!map.getLayer(rasterId)) {
                    map.addLayer({
                        'id': rasterId,
                        'type': 'raster',
                        'source': rasterId,
                        'paint': {
                            'raster-opacity': 0.7
                        }
                    });
                }
            }
        });
    } else if (!map.getLayer(rasterId)) {
        map.addLayer({
            'id': rasterId,
            'type': 'raster',
            'source': rasterId,
            'paint': {
                'raster-opacity': 0.7
            }
        });
    }
}

function getPaintSettings(layerPath, attribute, paintType, steps, colors) {
    const geometryType = layerPath.split("/")[1]; 
    
    const paintSettings = {
        fill: {
            base: {
                'fill-outline-color': '#a5a2a4',
                'fill-opacity': 0.8
            },
            default: {
                'fill-color': '#088'
            }
        },
        line: {
            base: {
                'line-width': 2,
                'line-opacity': 0.8
            },
            default: {
                'line-color': '#088'
            }
        },
        circle: {
            base: {
                'circle-opacity': 0.8,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#a5a2a4'
            },
            default: {
                'circle-color': '#088',
                'circle-radius': 6
            }
        }
    };

    if (!paintSettings[geometryType]) {
        console.error(`Unknown geometry type: ${geometryType}`);
        return null;
    }

    const colorProperty = {
        fill: 'fill-color',
        line: 'line-color',
        circle: 'circle-color'
    }[geometryType];

    let paintExpression;
    if (paintType === 'unique') {
        paintExpression = [
            'match',
            ['get', attribute],
            ...steps.flatMap((step, index) => [step, colors[index]]),
            '#ccc'
        ];
    } else if (paintType === 'interpolate') {
        paintExpression = [
            'interpolate',
            ['linear'],
            ['get', attribute],
            ...steps.flatMap((step, index) => [step, colors[index]])
        ];
    } else if (paintType === 'raster') {
        return {
            'raster-opacity': 0.7
        };
    } else {
        return {
            ...paintSettings[geometryType].base,
            ...paintSettings[geometryType].default
        };
    }

    return {
        ...paintSettings[geometryType].base,
        [colorProperty]: paintExpression
    };
}

function addPopupToLayer(map, layerId, attribute, naming, units) {
    map.on('click', layerId, (e) => {
        const properties = e.features[0].properties;
        const content = `
            <strong>${properties[naming]} <br>
            ${attribute}:</strong> ${properties[attribute]} ${units}
        `;
        
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(content)
            .addTo(map);
    });
}

function changeLayers(sectionId) {
    const sidebar = document.getElementById(`sidebar${sectionId}`);
    const slides = sidebar.getElementsByClassName('slide');
    const section = sidebar.closest('section');
    const switchButton = section.querySelector('.switch-button');
    const basinMap = section.querySelector('.basin-map');
    const dataMap = section.querySelector('.data-map');
    const dataMapInstance = mapInstances[dataMap.id];
    const basinOnly = ['15', '16', '17'];
    const dataOnly = [];
    
    
    sidebar.addEventListener('scroll', () => {
        for (let slide of slides) {
            const slideBox = slide.getBoundingClientRect();
            const sidebarRect = sidebar.getBoundingClientRect();
            const swCoordinate = slide.getAttribute('swCoordinate');
            const neCoordinate = slide.getAttribute('neCoordinate');
            
            const visiblePercentage = (
                Math.min(slideBox.bottom, sidebarRect.bottom) -
                Math.max(slideBox.top, sidebarRect.top)
            ) / slideBox.height;

            if (visiblePercentage >= 0.8) {
                if (basinOnly.includes(slide.id)) {
                    if (switchButton) {
                        switchButton.style.display = 'none';
                    }
                    if (basinMap) {
                        basinMap.classList.add('active');
                    }
                } else if (dataOnly.includes(slide.id)) {
                    if (switchButton) {
                        switchButton.style.display = 'none';
                    }
                    if (basinMap) {
                        basinMap.classList.remove('active');
                    }

                } else {
                    if (switchButton) {
                        switchButton.style.display = 'block';
                    }
                }
                mapSlideUpdate(slide, sectionId);

                if (swCoordinate && neCoordinate && dataMapInstance) {
                    try {
                        const swCoordArray = JSON.parse(swCoordinate);
                        const neCoordArray = JSON.parse(neCoordinate);
                
                        if (Array.isArray(swCoordArray) && Array.isArray(neCoordArray)) {
                            dataMapInstance.fitBounds([swCoordArray, neCoordArray]);
                        } else {
                            console.error("Coordinates are not in the correct array format.");
                        }
                    } catch (error) {
                        console.error("Error parsing coordinates:", error);
                    }
                }

                break;
            }
        }
    });
}

function setupSwitchButton() {
    document.querySelectorAll(".switch-button").forEach(button => {
        button.addEventListener("click", function () {
            const section = button.closest("section");
            const dataMap = section.querySelector(".data-map");
            const basinMap = section.querySelector(".basin-map");
            const sidebar = section.querySelector('.sidebar');
            const dataLegends = sidebar.querySelectorAll(".data-legend");
            const basinLegends = sidebar.querySelectorAll(".basin-legend");
            const buttonText = button.querySelector(".switch-button-text");
            
            const dataMapInstance = mapInstances[dataMap.id];
            const basinMapInstance = mapInstances[basinMap.id];
            
            if (basinMap.classList.contains("active")) {
                const center = basinMapInstance.getCenter();
                const zoom = basinMapInstance.getZoom();
                dataMapInstance.jumpTo({center, zoom});
                
                basinMap.classList.remove("active");
                dataMap.classList.add("active");
                
                dataLegends.forEach(legend => legend.classList.remove("inactive"));
                basinLegends.forEach(legend => legend.classList.remove("active"));
                buttonText.innerText = "View Basins";
                button.style.backgroundImage = "url('images/basin.svg')";
            } else {
                const center = dataMapInstance.getCenter();
                const zoom = dataMapInstance.getZoom();
                basinMapInstance.jumpTo({center, zoom});

                dataMap.classList.remove("active");
                basinMap.classList.add("active");
                
                dataLegends.forEach(legend => legend.classList.add("inactive")); 
                basinLegends.forEach(legend => legend.classList.add("active"));
                buttonText.innerText = "View Data";
                button.style.backgroundImage = "url('images/data.svg')";
            }
        });
    });
}

function populateSection(data, sectionId) {
    initializeLayerTracking(sectionId);
    
    data.forEach(slide => {
        createSlide(slide, `sidebar${sectionId}`);
        console.log(`Slide ${slide.id} created for section ${sectionId}`);
    });

    changeLayers(sectionId);
    setupSwitchButton(sectionId);
}

document.addEventListener('DOMContentLoaded', function() {
    fetch('data/section2.json')
        .then(response => response.json())
        .then(data => {
            populateSection(data, 2);
        })
        .catch(error => console.error('Error fetching or parsing JSON:', error));
    fetch('data/section3.json')
        .then(response => response.json())
        .then(data => {
            populateSection(data, 3);
        })
        .catch(error => console.error('Error fetching or parsing JSON:', error));
    fetch('data/section4.json')
        .then(response => response.json())
        .then(data => {
            populateSection(data, 4);
        })
        .catch(error => console.error('Error fetching or parsing JSON:', error));
});

document.addEventListener("DOMContentLoaded", function () {
    const sidebar2 = document.getElementById("sidebar2");
    const toggleBtn2 = document.getElementById("sidebar2-switch");

    toggleBtn2.addEventListener("click", function () {
        sidebar2.classList.toggle("collapsed");
        toggleBtn2.textContent = sidebar2.classList.contains("collapsed") ? ">>" : "<<";
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const sidebar3 = document.getElementById("sidebar3");
    const toggleBtn3 = document.getElementById("sidebar3-switch");

    toggleBtn3.addEventListener("click", function () {
        sidebar3.classList.toggle("collapsed");
        toggleBtn3.textContent = sidebar3.classList.contains("collapsed") ? ">>" : "<<";
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const sidebar4 = document.getElementById("sidebar4");
    const toggleBtn4 = document.getElementById("sidebar4-switch");

    toggleBtn4.addEventListener("click", function () {
        sidebar4.classList.toggle("collapsed");
        toggleBtn4.textContent = sidebar4.classList.contains("collapsed") ? ">>" : "<<";
    });
});