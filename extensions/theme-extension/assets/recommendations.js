document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('connector-recommendations-container');
    if (!container) return;

    const wrapper = container.closest('.connector-recommendations');
    const productId = wrapper.dataset.productId;

    if (!productId) {
        console.warn('No product ID found for recommendations');
        return;
    }

    try {
        // Fetch from App Proxy
        // Note: The path must match shopify.app.toml proxy config
        // prefix is 'apps', subpath is 'connector'
        const response = await fetch(`/apps/connector?product_id=${productId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const recommendations = data.recommendations;

        if (!recommendations || recommendations.length === 0) {
            container.innerHTML = '<p>No recommendations found.</p>';
            return;
        }

        // Render recommendations
        container.innerHTML = recommendations.map(rec => `
      <div class="connector-rec-item">
        <a href="${rec.url}">
            <img src="${rec.image}" alt="${rec.title}">
            <h3>${rec.title}</h3>
            <p>${rec.price}</p>
        </a>
      </div>
    `).join('');

    } catch (error) {
        console.error('Error fetching recommendations:', error);
        container.innerHTML = '<p>Failed to load recommendations.</p>';
    }
});
