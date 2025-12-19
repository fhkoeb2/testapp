import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { topic, shop, session, admin, payload } = await authenticate.webhook(
        request
    );

    if (!admin) {
        // The admin context isn't returned if the webhook fired after a shop was uninstalled.
        throw new Response();
    }

    // The topics handled here should be declared in the shopify.app.toml.
    // More info: https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration
    switch (topic) {
        case "INVENTORY_LEVELS_UPDATE":
            console.log(`Handling ${topic} for shop ${shop}`);
            console.log("Payload:", payload);

            // TODO: Forward data to SaaS Brain
            // await fetch(process.env.SAAS_API_URL + '/sync/inventory', {
            //   method: 'POST',
            //   body: JSON.stringify(payload),
            //   headers: { 'Content-Type': 'application/json' }
            // });
            break;
        default:
            throw new Response("Unhandled webhook topic", { status: 404 });
    }

    throw new Response();
};
