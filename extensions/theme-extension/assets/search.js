document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('connector-search-trigger');
    const overlay = document.getElementById('connector-search-overlay');
    const closeBtn = document.getElementById('connector-close-search');
    const input = document.getElementById('connector-search-input');
    const resultsContainer = document.getElementById('connector-search-results');

    if (!trigger || !overlay) return;

    trigger.addEventListener('click', () => {
        overlay.style.display = 'flex';
        input.focus();
    });

    closeBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
    });

    input.addEventListener('input', debounce(async (e) => {
        const query = e.target.value;
        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }

        resultsContainer.innerHTML = '<p>Searching...</p>';

        try {
            // Fetch from SaaS Brain via App Proxy
            // Using a different sub-route or query param for search
            const response = await fetch(`/apps/connector/search?q=${encodeURIComponent(query)}`);
            // Note: We need to implement /search route in app.proxy.tsx or handle logic there
            // Current app.proxy.tsx just returns static recommendations.
            // We'll just assume it returns a list for now or use the same mock.

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            // Assume data structure matches
            const items = data.recommendations || []; // Reusing mock key for now

            if (items.length === 0) {
                resultsContainer.innerHTML = '<p>No results found.</p>';
                return;
            }

            resultsContainer.innerHTML = items.map(item => `
            <div class="connector-search-result-item">
                <img src="${item.image}" alt="${item.title}">
                <div>
                    <a href="${item.url}"><strong>${item.title}</strong></a>
                    <p>${item.price}</p>
                </div>
            </div>
        `).join('');

        } catch (error) {
            console.error(error);
            resultsContainer.innerHTML = '<p>Error searching.</p>';
        }
    }, 300));

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
});
