document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const searchBtn = document.getElementById('searchBtn');
    const searchQuery = document.getElementById('searchQuery');
    const searchError = document.getElementById('searchError');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultCard = document.getElementById('resultCard');
    const videoThumbnail = document.getElementById('videoThumbnail');
    const videoTitle = document.getElementById('videoTitle');
    const videoDuration = document.getElementById('videoDuration');
    const videoChannel = document.getElementById('videoChannel');
    const videoViews = document.getElementById('videoViews');
    const downloadVideoBtn = document.getElementById('downloadVideoBtn');
    const downloadAudioBtn = document.getElementById('downloadAudioBtn');
    const downloadLoading = document.getElementById('downloadLoading');
    const downloadMessage = document.getElementById('downloadMessage');
    const downloadError = document.getElementById('downloadError');
    
    let currentVideo = null;
    
    // Event Listeners
    searchBtn.addEventListener('click', searchYouTube);
    downloadVideoBtn.addEventListener('click', () => downloadMedia('video'));
    downloadAudioBtn.addEventListener('click', () => downloadMedia('audio'));
    
    // Search YouTube function
    async function searchYouTube() {
        const query = searchQuery.value.trim();
        
        if (!query) {
            showError(searchError, 'Please provide a search query!');
            return;
        }
        
        clearError(searchError);
        hideElement(resultCard);
        showElement(loadingIndicator);
        
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to search');
            }
            
            currentVideo = data;
            displayVideoInfo(data);
            
            hideElement(loadingIndicator);
            showElement(resultCard);
            
        } catch (error) {
            hideElement(loadingIndicator);
            showError(searchError, error.message);
            console.error('Search error:', error);
        }
    }
    
    // Download media function - Fixed to handle downloads properly
    async function downloadMedia(type) {
        if (!currentVideo) return;
        
        showElement(downloadLoading);
        downloadMessage.textContent = `Preparing ${type} download...`;
        clearError(downloadError);
        
        try {
            // Create a hidden iframe for the download
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = `/api/download?url=${encodeURIComponent(currentVideo.url)}&type=${type}`;
            
            iframe.onload = function() {
                // Check if download failed (got JSON response)
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    const bodyText = iframeDoc.body.textContent;
                    
                    if (bodyText.startsWith('{')) {
                        const error = JSON.parse(bodyText);
                        throw new Error(error.error || error.details);
                    }
                } catch (e) {
                    showError(downloadError, e.message);
                } finally {
                    document.body.removeChild(iframe);
                    hideElement(downloadLoading);
                }
            };
            
            document.body.appendChild(iframe);

        } catch (error) {
            hideElement(downloadLoading);
            showError(downloadError, error.message);
            console.error('Download error:', error);
        }
    }
    
    // Helper functions
    function displayVideoInfo(video) {
        videoThumbnail.src = video.thumbnail;
        videoTitle.textContent = video.title;
        videoDuration.textContent = video.duration;
        videoChannel.textContent = video.channel;
        videoViews.textContent = video.views;
    }
    
    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }
    
    function clearError(element) {
        element.textContent = '';
        element.style.display = 'none';
    }
    
    function showElement(element) {
        element.style.display = 'block';
    }
    
    function hideElement(element) {
        element.style.display = 'none';
    }
});
