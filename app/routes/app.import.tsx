import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import {
    Card,
    Page,
    Layout,
    Text,
    Button,
    BlockStack,
    Box,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { runBulkImport } from "../services/bulk_import";

export const loader = async ({ request }) => {
    await authenticate.admin(request);
    return null;
};

export const action = async ({ request }) => {
    const { admin } = await authenticate.admin(request);
    const result = await runBulkImport(admin);
    console.log("Bulk import result:", result);
    return json(result);
};

export default function ImportPage() {
    const fetcher = useFetcher();
    const isLoading = fetcher.state === "submitting" || fetcher.state === "loading";
    const data = fetcher.data as any;

    return (
        <Page title="Data Synchronization">
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text as="h2" variant="headingMd">
                                Initial Data Load
                            </Text>
                            <p>
                                Click the button below to start a bulk import of all products and inventory levels.
                                This process runs in the background. You can check the server logs for progress.
                            </p>
                            <Box>
                                <fetcher.Form method="post">
                                    <Button submit loading={isLoading} variant="primary">
                                        Start Bulk Import
                                    </Button>
                                </fetcher.Form>
                            </Box>

                            {data?.data?.bulkOperationRunQuery?.bulkOperation && (
                                <Box paddingBlockStart="200">
                                    <Text as="p" tone="success">
                                        Bulk operation started! ID: {data.data.bulkOperationRunQuery.bulkOperation.id}
                                    </Text>
                                </Box>
                            )}

                            {data?.data?.bulkOperationRunQuery?.userErrors?.length > 0 && (
                                <Box paddingBlockStart="200">
                                    <Text as="p" tone="critical">
                                        Error: {data.data.bulkOperationRunQuery.userErrors[0].message}
                                    </Text>
                                </Box>
                            )}
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
