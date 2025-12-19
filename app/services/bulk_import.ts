export async function runBulkImport(admin: any) {
    const query = `
    {
      products {
        edges {
          node {
            id
            title
            description
            handle
            vendor
            productType
            tags
            status
            updatedAt
            images(first: 10) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 50) {
              edges {
                node {
                  id
                  price
                  sku
                  inventoryItem {
                    inventoryLevels(first: 1) {
                      edges {
                        node {
                          available
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

    const response = await admin.graphql(
        `#graphql
    mutation bulkOperationRunQuery($query: String!) {
      bulkOperationRunQuery(query: $query) {
        bulkOperation {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }`,
        {
            variables: {
                query: query,
            },
        }
    );

    const data = await response.json();
    return data;
}
