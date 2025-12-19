# Shopify Connector App: Walkthrough & Verification Guide

This document provides a detailed breakdown of every file created or modified, explaining the **Why** (architectural reason) and the **What** (technical implementation). It also includes a step-by-step verification guide.

## 1. Configuration & Access Control
### [shopify.app.toml](file:///Users/fhkoeb977/Projects/ShoApp/testapp/shopify.app.toml)
- **Why**: The app effectively needs to "listen" to the store and "speak" to the storefront securely.
- **What**:
  - Added `write_products`, `read_inventory` scopes to access necessary data.
  - Registered webhooks: `products/create`, `products/update`, `products/delete` (for real-time sync), `inventory_levels/update` (for stock sync), and `bulk_operations/finish` (for initial load).
  - Configured `[app_proxy]` to route requests from `https://store.myshopify.com/apps/connector` to our Remix backend (`/app/routes/app.proxy.tsx`). This hides API keys and provides a secure tunnel.

## 2. Backend: Data Synchronization
### [app/routes/webhooks.products.eviction.tsx](file:///Users/fhkoeb977/Projects/ShoApp/testapp/app/routes/webhooks.products.eviction.tsx)
- **Why**: Real-time updates. When a merchant changes a product title or price, the SaaS "Brain" must know immediately to update the search index.
- **What**: A Remix Action that validates the Shopify webhook signature and processes `PRODUCTS_CREATE`, `UPDATE`, and `DELETE` topics. Currently logs the payload; ready to `fetch()` to your SaaS.

### [app/routes/webhooks.inventory.update.tsx](file:///Users/fhkoeb977/Projects/ShoApp/testapp/app/routes/webhooks.inventory.update.tsx)
- **Why**: Accuracy. If an item goes out of stock, we must stop recommending it immediately.
- **What**: similar handler specifically for `INVENTORY_LEVELS_UPDATE`.

### [app/services/bulk_import.ts](file:///Users/fhkoeb977/Projects/ShoApp/testapp/app/services/bulk_import.ts)
- **Why**: Efficiency. Fetching 10k products one-by-one hits rate limits. Bulk Operations are the only scalable way to do initial data loads.
- **What**: A GraphQL service that constructs a `bulkOperationRunQuery` to fetch *all* products, images, and inventory levels in a single request.

### [app/routes/app.import.tsx](file:///Users/fhkoeb977/Projects/ShoApp/testapp/app/routes/app.import.tsx)
- **Why**: Control. The merchant or admin needs a button to "Start Initial Sync".
- **What**: An Admin Page (Embedded App UI) with a button that calls the `bulk_import` service and shows the operation status.

### [app/routes/webhooks.bulk_operation.finish.tsx](file:///Users/fhkoeb977/Projects/ShoApp/testapp/app/routes/webhooks.bulk_operation.finish.tsx)
- **Why**: Async Processing. The bulk import can take minutes. Shopify notifies us via webhook when the JSONL file is ready.
- **What**: A handler that receives the `bulk_operations/finish` event containing the `url` to the JSONL file. This is where you would stream that file to your SaaS.

## 3. Frontend: Theme App Extensions
### [extensions/theme-extension/shopify.extension.toml](file:///Users/fhkoeb977/Projects/ShoApp/testapp/extensions/theme-extension/shopify.extension.toml)
- **Why**: To register the UI components with Shopify's Theme ecosystem.
- **What**: Defines the extension type as `theme`.

### [extensions/theme-extension/blocks/recommendations.liquid](file:///Users/fhkoeb977/Projects/ShoApp/testapp/extensions/theme-extension/blocks/recommendations.liquid)
- **Why**: Merchants use the Theme Editor (drag-and-drop) to place widgets.
- **What**: A "App Block" that renders a placeholder `<div>`. It passes the current `product.id` to the JS via data attributes.

### [extensions/theme-extension/assets/recommendations.js](file:///Users/fhkoeb977/Projects/ShoApp/testapp/extensions/theme-extension/assets/recommendations.js)
- **Why**: Dynamic Content. Liquid is static (cached). Recommendations are dynamic per user/context.
- **What**: Client-side JS that calls fetch(`/apps/connector?product_id=...`). It uses the App Proxy to get data securely and then injects HTML into the container.

### [extensions/theme-extension/blocks/search_embed.liquid](file:///Users/fhkoeb977/Projects/ShoApp/testapp/extensions/theme-extension/blocks/search_embed.liquid)
- **Why**: Global accessibility. A search bar usually floats or lives in the header, not just on a product page.
- **What**: An "App Embed" (floating widget). It renders a search button/icon that toggles an overlay.

### [extensions/theme-extension/assets/search.js](file:///Users/fhkoeb977/Projects/ShoApp/testapp/extensions/theme-extension/assets/search.js)
- **Why**: Interactive Search.
- **What**: Implements the debounce logic and fetches results from the App Proxy (`/apps/connector/search`) as the user types.

### [app/routes/app.proxy.tsx](file:///Users/fhkoeb977/Projects/ShoApp/testapp/app/routes/app.proxy.tsx)
- **Why**: Security & CORS. Browsers can't call your SaaS API directly if it doesn't allow CORS for every store domain. Also, you don't want to expose API keys in JS.
- **What**: The App Proxy endpoint. It validates the request came from Shopify, acts as a middleware, calls your SaaS (mocked), and returns JSON to the frontend.

## 4. Analytics: Web Pixels
### [extensions/pixel-extension/...](file:///Users/fhkoeb977/Projects/ShoApp/testapp/extensions/pixel-extension/)
- **Why**: Privacy & Reliability. Old "script tags" are unreliable and blocked by ad blockers. Web Pixels run in a sandwich sandbox.
- **What**: Subscribes to standard events (`search_submitted`, `product_viewed`, `checkout_completed`) and forwards them to your tracking endpoint.

---

## Verification Guide

### Step 1: Install & Config
1.  Run `npm run dev -- --reset`.
2.  Install the app on your Development Store.
3.  **Validate**: Verify `shopify.app.toml` updated scopes are accepted during install.

### Step 2: Test Data Sync (Backend)
1.  **Bulk Import**:
    - Go to the App Dashboard in Shopify Admin.
    - Click "Start Bulk Import".
    - **Validate**: Check the terminal logs for `Bulk operation started! ID: ...`.
2.  **Webhooks**:
    - Terminate `npm run dev` and run `shopify app webhook trigger`.
    - Select `products/update`.
    - **Validate**: Check terminal logs for `Handling PRODUCTS_UPDATE`.

### Step 3: Test Frontend (Theme Extension)
1.  Ensure `npm run dev` is running.
2.  Go to **Online Store > Themes > Customize**.
3.  **Recommendations**:
    - Navigate to a **Product Page**.
    - Click "Add Block" in the Product Information section.
    - Select **Product Recommendations** (from your app).
    - **Validate**: You should see the mock "Recommended Product 1" rendered.
4.  **Search Bar**:
    - Click the **App Embeds** icon (left sidebar, bottom).
    - Enable **Global Search Bar**.
    - **Validate**: A "Search" button appears. Click it, type "test", and see mock results.
    - **Save** the theme changes.

### Step 4: Test Proxy
1.  Visit your store's proxy URL directly in the browser: `https://<your-store>.myshopify.com/apps/connector?product_id=123`.
2.  **Validate**: You should see a JSON response with the recommendations.

### Step 5: Test Analytics (Pixel)
1.  Go to your storefront.
2.  Open Chrome DevTools > Console.
3.  Perform a search or view a product.
4.  **Validate**: You should see `[Pixel] search_submitted` logs (if the pixel environment allows console logging, otherwise check the network tab for beacon requests).


FK ADDED Ths
## Configuring App & Webhooks
I updated 
shopify.app.toml(file:///Users/fhkoeb977/Projects/ShoApp/testapp/shopify.app.toml)
 with the necessary webhooks and scopes. Now I am creating the corresponding webhook handler files in app/routes/ to verify and process the incoming webhook requests.

###Files Edited
webhooks.inventory.update.tsx(file:///Users/fhkoeb977/Projects/ShoApp/testapp/app/routes/webhooks.inventory.update.tsx)
webhooks.products.eviction.tsx(file:///Users/fhkoeb977/Projects/ShoApp/testapp/app/routes/webhooks.products.eviction.tsx)
shopify.app.toml(file:///Users/fhkoeb977/Projects/ShoApp/testapp/shopify.app.toml)  

###Files Added
bulk_import.ts(file:///Users/fhkoeb977/Projects/ShoApp/testapp/app/services/bulk_import.ts)
app.import.tsx(file:///Users/fhkoeb977/Products/ShoApp/testapp/app/routes/app.import.tsx)
webhooks.bulk_operation.finish.tsx(file:///Users/fhkoeb977/Products/ShoApp/testapp/app/routes/webhooks.bulk_operation.finish.tsx)


## Implementing Bulk Data Sync
I completed the configuration and implementation of product and inventory webhooks. Now I am moving on to the Bulk Data Sync implementation, starting with updating the configuration to listen for bulk operation completion.

###Files Edited
app.import.tsx(file:///Users/fhkoeb977/Products/ShoApp/testapp/app/routes/app.import.tsx)
webhooks.bulk_operation.finish.tsx(file:///Users/fhkoeb977/Products/ShoApp/testapp/app/routes/webhooks.bulk_operation.finish.tsx)
bulk_import.ts(file:///Users/fhkoeb977/Products/ShoApp/testapp/app/services/bulk_import.ts)

###Files Added
shopify.app.toml(file:///Users/fhkoeb977/Products/ShoApp/testapp/shopify.app.toml)

###Progress Updates
Adding bulk operation webhook to config, creating import service, webhook handler, and manual trigger UI.

## Implementing Frontend Extensions
I created the "Recommended Products" Theme App Extension block, including its Liquid, CSS, and JS files. I also configured the App Proxy and created the corresponding Remix route. Now I am implementing the "Search Bar" App Embed to complete the frontend phase.

###Files Edited
search.js(file:///Users/fhkoeb977/Products/ShoApp/testapp/app/routes/search.js)
search.css(file:///Users/fhkoeb977/Products/ShoApp/testapp/app/routes/search.css)
search_embed.liquid(file:///Users/fhkoeb977/Products/ShoApp/testapp/extensions/theme-extension/blocks/search_embed.liquid)
recommendations.js(file:///Users/fhkoeb977/Products/ShoApp/testapp/app/routes/recommendations.js)
recommendations.css(file:///Users/fhkoeb977/Products/ShoApp/testapp/app/routes/recommendations.css)

###Progress Updates
1
Creating Theme App Extension for Recommended Products and Search Bar.

2
Configuring App Proxy and creating proxy route. Then creating Theme Extension files.

3
Implementing Search Bar App Embed and updating task list.

## Implementing Web Pixels
I completed all frontend work, including the Theme App Extension for product recommendations and the Search Bar App Embed. I am now implementing the Web Pixels extension to collect analytics data (search, view, cart, checkout) and forward it to the SaaS.

###Files Edited
package.json(file:///Users/fhkoeb977/Products/ShoApp/testapp/package.json)
index.ts(file:///Users/fhkoeb977/Products/ShoApp/testapp/index.ts)
shopify.extension.toml(file:///Users/fhkoeb977/Products/ShoApp/testapp/shopify.extension.toml)

###Progress Updates
1
Creating Web Pixels extension to track user events.

