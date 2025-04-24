import StoryDatabase from '../../data/database.js';

const BookmarkPresenter = {
    init({ view }) {
        this._view = view;
        this._loadBookmarks();
    },

    async _loadBookmarks() {
        try {
            const stories = await StoryDatabase.getAllSavedStories();
            this._view.displayBookmarks(stories);
        } catch (error) {
            this._view.showError('Failed to load bookmarks');
            console.error(error);
        }
    },

    async removeBookmark(storyId) {
        try {
            const success = await StoryDatabase.deleteStory(storyId);
            if (success) {
                this._loadBookmarks(); 
            } else {
                this._view.showError('Failed to remove bookmark');
            }
        } catch (error) {
            this._view.showError('Failed to remove bookmark');
            console.error(error);
        }
    }
};

export { BookmarkPresenter as default };