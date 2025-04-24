// scripts/pages/detail/detail-presenter.js
import { fetchWithToken } from "../../data/api";

const DetailPresenter = {
    async init({ view, storyId }) {
        this._view = view;
        this._storyId = storyId;

        await this._fetchStoryDetail();
    },

    async _fetchStoryDetail() {
        try {
            // Get the original case-sensitive ID from the URL
            const urlParts = window.location.hash.split('/');
            const caseSensitiveId = urlParts[urlParts.length - 1];
            
            // Use the case-sensitive ID for the API request
            const response = await fetchWithToken(`https://story-api.dicoding.dev/v1/stories/${caseSensitiveId}`);
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch story details');
            }
    
            const data = await response.json();
    
            if (data.error) {
                throw new Error(data.message || 'Failed to load story');
            }
    
            // Pass the story data to the view
            this._view.displayStory(data.story);
    
        } catch (error) {
            console.error('Error fetching story details:', error);
            this._view.showError(error.message || 'Failed to load story');
    
            // Handle 401 unauthorized error
            if (error.message.includes('401')) {
                localStorage.removeItem('accessToken');
                window.location.hash = '#/';
            }
        }
    }
};

export default DetailPresenter;