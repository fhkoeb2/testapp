
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session, liquid } = await authenticate.public.appProxy(request);

    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    console.log("App Proxy request from shop:", session.shop);

    // Parse query params to forward to SaaS
    const url = new URL(request.url);
    const productId = url.searchParams.get("product_id");

    // Mock response for now. 
    // TODO: Fetch from SaaS Brain using internal API key
    // const saasResponse = await fetch(`https://saas-brain.com/recommendations?product_id=${productId}`);

    const recommendations = [
        {
            id: 1,
            title: "Recommended Product 1",
            price: "$19.99",
            image: "https://via.placeholder.com/150",
            url: "/products/recommended-product-1"
        },
        {
            id: 2,
            title: "Recommended Product 2",
            price: "$29.99",
            image: "https://via.placeholder.com/150",
            url: "/products/recommended-product-2"
        }
    ];

    return json({
        recommendations: recommendations
    }, {
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    // Handle POST requests if needed
    return json({ status: "ok" });
};
