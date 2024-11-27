function createSlide(slide, sidebarId) {
    var sidebarSlide = document.createElement('div');
    sidebarSlide.className = 'slide';
    sidebarSlide.setAttribute('name', slide.title);
    slideID = "slide" + slide.id
    sidebarSlide.setAttribute('id', slideID);
    sidebarSlide.setAttribute('background-image', slide.image1);
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

function changeBackground(sidebarID, mapID) {
    const sidebar = document.getElementById(sidebarID);
    const map = document.getElementById(mapID);
    const slides = sidebar.getElementsByClassName('slide');
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
        
        map.classList.add('fade-out');
        setTimeout(() => {
            map.style.backgroundImage = `url(${backgroundImage})`;
            map.classList.remove('fade-out');
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
            const backgroundImage = mostVisibleSlide.getAttribute('background-image');
            if (map.style.backgroundImage !== `url(${backgroundImage})`) {
                updateBackground(backgroundImage);
                lastActiveSlide = mostVisibleSlide;
            }
        }
    }, 50);

    sidebar.addEventListener('scroll', handleScroll);
}

function populateSection1(data) {
    data.forEach(function(slide) {
        const sidebarID = "sidebar1";
        const mapID = "map1";
       
        createSlide(slide, sidebarID);
        console.log(`Slide ${slide.id} created`);
    });
    
    changeBackground("sidebar1", "map1");
}

document.addEventListener('DOMContentLoaded', function() {
    fetch('section1.json')
        .then(response => response.json())
        .then(data => {
            populateSection1(data);
        })
        .catch(error => console.error('Error fetching or parsing JSON:', error));
});