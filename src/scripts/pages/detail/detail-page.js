import 'leaflet/dist/leaflet.css';

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

export default class DetailPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.story = null;
    this.isLoading = true;
    this.map = null;
    this.resizeObserver = null;
    this._initTemplate();
  }

  _initTemplate() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          background-color: #222831;
          color: #eeeeee;
          font-family: 'Poppins', sans-serif;
          overflow-x: hidden;
        }

        .page-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100%;
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
          width: 100%;
          -webkit-overflow-scrolling: touch;
          padding: 1rem 0;
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

        .story-container {
          background-color: #393e46;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          margin: 1rem 0;
          animation: fade-in 0.5s ease-out;
        }

        .story-image {
          width: 100%;
          height: auto;
          max-height: 500px;
          object-fit: cover;
          display: block;
        }
        
        .story-content {
          padding: 1.5rem;
        }
        
        .story-title {
          font-size: 1.8rem;
          margin-bottom: 1rem;
          color: #93BFCF;
          word-break: break-word;
        }
        
        .story-description {
          color: #eeeeee;
          margin-bottom: 1.5rem;
          line-height: 1.6;
          font-size: 1rem;
          word-break: break-word;
        }
        
        .story-meta {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 0.5rem;
          color: #9ca3af;
          font-size: 0.9rem;
          border-top: 1px solid #4a4e57;
          padding-top: 1rem;
          margin-top: 1rem;
        }
        
        .story-author {
          font-weight: 500;
        }
        
        .story-date {
          font-style: italic;
        }
        
        .story-map-container {
          width: 100%;
          height: 400px;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 1.5rem;
          background: #222831;
          position: relative;
          border: 2px solid #4a4e57;
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

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .story-content {
            padding: 1rem;
          }

          .story-title {
            font-size: 1.5rem;
          }

          .story-map-container {
            height: 350px;
          }
        }

        @media (max-width: 480px) {
          .navbar {
            flex-direction: column;
            gap: 1rem;
            padding: 0.75rem;
          }

          .nav-links {
            width: 100%;
            justify-content: space-between;
          }

          .story-map-container {
            height: 300px;
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
        <div class="scrollable-content">
          <div class="content">
            <div id="storyContainer" class="loading">
              <div class="loading-spinner"></div>
              <p>Loading story...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    const urlParts = window.location.hash.split('/');
    const storyId = urlParts[urlParts.length - 1];

    this.shadowRoot.querySelector('.back-btn').addEventListener('click', () => {
      window.location.hash = '#/home';
    });

    this.init(storyId);
  }

  async init(storyId) {
    if (!storyId) {
      this.showError('Story ID not found');
      return;
    }

    try {
      this.isLoading = true;
      this.render();

      await DetailPresenter.init({
        view: this,
        storyId: storyId
      });
    } catch (error) {
      this.showError(error.message);
    }
  }

  async displayStory(story) {
    this.story = story;
    this.isLoading = false;
    this.render();

    if (story.lat && story.lon) {
      await this.initMap(story.lat, story.lon, story.name);
    }
  }

  async initMap(lat, lon, title) {
    // Clean up previous map if exists
    this._cleanupMap();

    const mapContainer = this.shadowRoot.querySelector('.map-container');
    if (!mapContainer) return;

    try {
      // Load Leaflet dynamically
      const L = await import('leaflet');
      initLeaflet();

      // Create map with same settings as home page
      this.map = L.map(mapContainer, {
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

      // Add tile layer with same settings as home page
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
        minZoom: 13,
        crossOrigin: true
      }).addTo(this.map);

      // Add marker
      const marker = L.marker([lat, lon]).addTo(this.map);

      // Add popup with same style as home page
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

      // Fix map rendering issues
      setTimeout(() => {
        this.map.invalidateSize();
      }, 100);

      // Add resize observer like in home page
      this.resizeObserver = new ResizeObserver(() => {
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize({ pan: false });
          }
        }, 100);
      });
      this.resizeObserver.observe(mapContainer);

    } catch (error) {
      console.error('Error initializing map:', error);
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

  _cleanupMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  showError(message) {
    const container = this.shadowRoot.getElementById('storyContainer');
    container.innerHTML = `
      <div class="error-message">
        <h3>Error</h3>
        <p>${message}</p>
        <p>Please try again or go back to <a href="#/home" style="color: #93BFCF;">home page</a>.</p>
      </div>
    `;
  }

  render() {
    const container = this.shadowRoot.getElementById('storyContainer');

    if (this.isLoading) {
      container.innerHTML = `
          <div class="loading">
            <div class="loading-spinner"></div>
            <p>Loading story...</p>
          </div>
        `;
      return;
    }

    if (!this.story) {
      container.innerHTML = `
          <div class="error-message">
            Story not found
          </div>
        `;
      return;
    }

    // Create the story container structure
    container.innerHTML = `
        <div class="story-container">
          <img src="${this.story.photoUrl}" alt="${this.story.name}" class="story-image" loading="lazy">
          <div class="story-content">
            <h1 class="story-title">${this.story.name}</h1>
            <div class="story-description">${this.story.description}</div>
            <div class="story-meta">
              <span class="story-author">By: ${this.story.name}</span>
              <span class="story-date">Posted on: ${new Date(this.story.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</span>
            </div>
            ${this.story.lat && this.story.lon ?
        `<div class="story-map-container">
                <div class="map-container"></div>
              </div>` : ''}
          </div>
        </div>
      `;

    // If there are coordinates, initialize the map after the DOM is updated
    if (this.story.lat && this.story.lon) {
      // Use setTimeout to ensure the DOM is fully updated
      setTimeout(() => {
        this.initMap(this.story.lat, this.story.lon, this.story.name);
      }, 0);
    }
  }

  disconnectedCallback() {
    this._cleanupMap();
  }
}