import { register } from "@shopify/web-pixels-extension";

register(async (api) => {
    const { analytics, browser, settings } = api;

    const trackEvent = (name, data) => {
        // TODO: Send to SaaS Brain
        console.log(`[Pixel] ${name}`, data);

        // browser.network.beacon is recommended for reliability
        // browser.network.beacon('https://saas-brain.com/track', JSON.stringify({ name, data }));
    };

    analytics.subscribe("search_submitted", (event) => {
        trackEvent("search_submitted", event.data);
    });

    analytics.subscribe("product_viewed", (event) => {
        trackEvent("product_viewed", event.data);
    });

    analytics.subscribe("product_added_to_cart", (event) => {
        trackEvent("product_added_to_cart", event.data);
    });

    analytics.subscribe("checkout_completed", (event) => {
        trackEvent("checkout_completed", event.data);
    });

});
