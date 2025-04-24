import 'leaflet/dist/leaflet.css';
import BookmarkPresenter from './bookmark-presenter.js';

// Global Leaflet options
const initLeaflet = () => {
    if (typeof L === 'undefined') return;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

export default class BookmarkPage extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.bookmarkedStories = [];
        this.isLoading = true;
        this.maps = {};
        this.resizeObservers = {};
        this._initTemplate();
    }

    _initTemplate() {
        this.shadowRoot.innerHTML = `
    <style>
        :host {
            display: block;
            background-color: #222831;
            color: #eeeeee;
            font-family: 'Poppins', sans-serif;
            overflow-x: hidden;
        }

        .page-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          max-width: 100vw;
        }
        
        .navbar {
          background-color: #27374D;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          position: sticky;
          top: 0;
          z-index: 100;
          flex-shrink: 0;
        }

        .scrollable-content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem 0;
          -webkit-overflow-scrolling: touch;
          width: 100%;
          box-sizing: border-box;
        }

        .main-content {
          flex: 1;
          margin-top: 70px; 
          padding-bottom: 2rem;
          width: 100%;
        }

        .content {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 0 1rem;
          box-sizing: border-box;
        }
        
        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: #93BFCF;
          text-decoration: none;
        }
        
        .nav-links {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }
        
        .nav-link {
          color: #eeeeee;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        
        .nav-link:hover {
          color: #93BFCF;
        }
        
        .back-btn {
          background: linear-gradient(135deg, rgb(57, 74, 99) 0%, #27374D 100%);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .back-btn:hover {
          background: linear-gradient(135deg, #93BFCF 0%, #6096B4 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px #BDCDD6;
        }

        .back-btn:active {
          transform: scale(0.95) translateY(-2px);
          transition: transform 0.1s ease;
        }

        .stories-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }
        
        .story-card {
          background-color: #393e46;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease;
        }
        
        .story-card:hover {
          transform: translateY(-5px);
        }
        
        .story-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }
        
        .story-content {
          padding: 1rem;
        }
        
        .story-title {
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
          color: #93BFCF;
        }
        
        .story-description {
          color: #eeeeee;
          margin-bottom: 0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .story-date {
          color: #9ca3af;
          font-size: 0.8rem;
        }
        
        .story-map {
          position: relative;
          z-index: 0;
          height: 200px;
          width: 100%;
          min-height: 200px;
          margin-top: 1rem;
          border-radius: 8px;
          overflow: hidden;
          background: #222831;
        }
        
        .map-container {
          height: 100%;
          width: 100%;
          position: relative;
        }

        .leaflet-container {
          background: #222831 !important;
          height: 100% !important;
          width: 100% !important;
        }
        
        .leaflet-tile {
          position: absolute;
          left: 0;
          top: 0;
          filter: none !important;
          -webkit-filter: none !important;
          image-rendering: crisp-edges;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
          background: #27374D !important;
          color: #eeeeee !important;
        }
        
        .leaflet-popup-content {
          margin: 8px !important;
          font-size: 14px !important;
          line-height: 1.4 !important;
        }
        
        .leaflet-popup-tip {
          background: #27374D !important;
        }
        
        .leaflet-marker-icon {
          filter: hue-rotate(180deg) brightness(1.2);
        }

        .loading {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 300px;
          color: #93BFCF;
          gap: 1rem;
        }

        .loading-spinner {
          border: 4px solid rgba(147, 191, 207, 0.3);
          border-radius: 50%;
          border-top: 4px solid #93BFCF;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        
        .error-message {
          text-align: center;
          padding: 2rem;
          color: #ff6b6b;
          background-color: rgba(255, 107, 107, 0.1);
          border-radius: 8px;
          margin: 1rem 0;
        }

        .empty-message {
          text-align: center;
          padding: 2rem;
          color: #93BFCF;
          background-color: rgba(147, 191, 207, 0.1);
          border-radius: 8px;
          margin: 1rem 0;
        }

        .remove-btn {
          background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
          width: 100%;
        }

        .remove-btn:hover {
          background: linear-gradient(135deg, #ff4757 0%, #ff6b6b 100%);
          transform: translateY(-2px);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .stories-container {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <div class="page-container">
        <nav class="navbar">
          <a href="#/home" class="logo">Story Apps Dicoding</a>
          <div class="nav-links">
            <a href="#/home" class="nav-link">Home</a>
            <a href="#/create" class="nav-link">Create</a>
            <button class="back-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
              </svg>
              Back to Home
            </button>
          </div>
        </nav>
        <main class="main-content">
          <div class="content">
            <h1>Bookmarked Stories</h1>
            <div id="storiesContainer">
              <div class="loading">
                <div class="loading-spinner"></div>
                <p>Loading bookmarks...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
    }

    connectedCallback() {
        this.shadowRoot.querySelector('.back-btn').addEventListener('click', () => {
            window.location.hash = '#/home';
        });

        BookmarkPresenter.init({
            view: this
        });
    }

    displayBookmarks(stories) {
        this.bookmarkedStories = stories;
        this.isLoading = false;
        this.render();
    }

    showError(message) {
        const container = this.shadowRoot.getElementById('storiesContainer');
        container.innerHTML = `
      <div class="error-message">
        <h3>Error</h3>
        <p>${message}</p>
      </div>
    `;
    }

    render() {
        const container = this.shadowRoot.getElementById('storiesContainer');

        if (this.isLoading) {
            container.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>Loading bookmarks...</p>
        </div>
      `;
            return;
        }

        if (!this.bookmarkedStories || this.bookmarkedStories.length === 0) {
            container.innerHTML = `
        <div class="empty-message">
          <p>No bookmarked stories yet.</p>
        </div>
      `;
            return;
        }

        container.innerHTML = '<div class="stories-container"></div>';
        const storiesContainer = container.querySelector('.stories-container');

        this.bookmarkedStories.forEach((story, index) => {
            const storyElement = document.createElement('div');
            storyElement.className = 'story-card';
            storyElement.setAttribute('data-story-id', story.id);

            const mapHtml = story.lat && story.lon ? `
        <div class="story-map">
          <div class="map-container" id="map-container-${story.id}"></div>
        </div>
      ` : '';

            storyElement.innerHTML = `
        <img src="${story.photoUrl}" alt="${story.name}" class="story-image" loading="lazy">
        <div class="story-content">
          <h3 class="story-title">${story.name}</h3>
          <p class="story-description">${story.description}</p>
          <p class="story-date">${new Date(story.createdAt).toLocaleDateString()}</p>
          <button class="remove-btn" data-story-id="${story.id}">Remove Bookmark</button>
          ${mapHtml}
        </div>
      `;

            storiesContainer.appendChild(storyElement);

            // Add click handler for remove button
            storyElement.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const storyId = e.target.getAttribute('data-story-id');
                BookmarkPresenter.removeBookmark(storyId);
            });

            // Add click handler for story card
            storyElement.addEventListener('click', () => {
                window.location.hash = `#/detail/${story.id}`;
            });

            if (story.lat && story.lon) {
                requestAnimationFrame(() => {
                    this._initMap(story.id, story.lat, story.lon, story.name);
                });
            }
        });
    }

    _initMap(id, lat, lon, title) {
        const mapContainer = this.shadowRoot.getElementById(`map-container-${id}`);

        if (!mapContainer) return;

        if (this.maps[id]) {
            this.maps[id].remove();
            delete this.maps[id];
        }

        if (this.resizeObservers[id]) {
            this.resizeObservers[id].disconnect();
            delete this.resizeObservers[id];
        }

        mapContainer.innerHTML = '';

        try {
            const map = L.map(mapContainer, {
                preferCanvas: true,
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                keyboard: false,
                touchZoom: false,
                zoomSnap: 0.1
            }).setView([lat, lon], 15);

            this.maps[id] = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 18,
                minZoom: 13,
                crossOrigin: true
            }).addTo(map);

            const marker = L.marker([lat, lon]).addTo(map);

            const popupContent = `
        <div style="font-family: 'Poppins', sans-serif; padding: 8px; max-width: 200px;">
          <strong>${title}</strong><br>
          <small>Lat: ${lat.toFixed(4)}</small><br>
          <small>Lng: ${lon.toFixed(4)}</small>
        </div>
      `;

            marker.bindPopup(popupContent, {
                closeButton: false,
                autoClose: false,
                closeOnClick: false,
                className: 'custom-popup'
            }).openPopup();

            const resizeObserver = new ResizeObserver(() => {
                setTimeout(() => {
                    map.invalidateSize({ pan: false });
                }, 100);
            });

            resizeObserver.observe(mapContainer);
            this.resizeObservers[id] = resizeObserver;

            setTimeout(() => {
                map.invalidateSize({ pan: false });
            }, 300);

        } catch (err) {
            console.error('Map initialization error:', err);
            mapContainer.innerHTML = `
        <div style="
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #444;
            color: #eee;
            font-family: sans-serif;
            text-align: center;
            padding: 1rem;
        ">
            <div>
                <p>Map unavailable</p>
                <small>Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}</small>
            </div>
        </div>
    `;
        }
    }

    disconnectedCallback() {
        Object.values(this.maps).forEach(map => {
            map.remove();
        });
        this.maps = {};

        Object.values(this.resizeObservers).forEach(observer => {
            observer.disconnect();
        });
        this.resizeObservers = {};
    }
}