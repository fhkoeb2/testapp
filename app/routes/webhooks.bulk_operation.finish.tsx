import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { topic, shop, session, admin, payload } = await authenticate.webhook(
        request
    );

    if (!admin) {
        throw new Response();
    }

    // The topics handled here should be declared in the shopify.app.toml.
    switch (topic) {
        case "BULK_OPERATIONS_FINISH":
            console.log(`Handling ${topic} for shop ${shop}`);
            console.log("Payload:", payload);

            if (payload.status === "COMPLETED" && payload.url) {
                console.log("Bulk operation completed. Fetching data from:", payload.url);

                // TODO: Forward data to SaaS Brain
                // In a real app, you might want to stream this data if it's large.
                // For now, we'll just log that we would forward it.

                // const response = await fetch(payload.url);
                // const jsonlData = await response.text();

                // await fetch(process.env.SAAS_API_URL + '/sync/bulk', {
                //   method: 'POST',
                //   body: jsonlData, // Or stream it
                //   headers: { 'Content-Type': 'application/jsonl' }
                // });
            } else {
                console.log("Bulk operation failed or has no URL:", payload.status);
            }
            break;
        default:
            throw new Response("Unhandled webhook topic", { status: 404 });
    }

    throw new Response();
};
