import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import axios from "axios";

// Load environment variables
dotenv.config();

// Check if token exists and log to stderr for debugging
// const token = process.env.TERMINAL_BEARER_TOKEN;
const token = "trm_live_33c8f6bd54c52aa1cb87";
console.error("Token available:", !!token);

// Create axios instance for Terminal API
const terminalApi = axios.create({
  baseURL: "https://api.terminal.shop",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

// Shopping cart state
const shoppingCart = new Map();

// Create MCP server
const server = new McpServer({
  name: "Terminal.shop API",
  version: "1.0.0",
  description: "MCP server for Terminal.shop e-commerce platform",
});

// Enhanced products resource
server.resource("products", "terminal://products", async (uri) => {
  try {
    const response = await terminalApi.get("/product");
    const products = response.data.data;

    // Format products in a more readable way
    let formattedText = "# Available Products from Terminal.shop\n\n";

    products.forEach((product) => {
      formattedText += `## ${product.name}\n`;
      formattedText += `ID: ${product.id}\n`;
      formattedText += `${product.description}\n\n`;

      formattedText += "### Variants:\n";
      product.variants.forEach((variant) => {
        formattedText += `- ${variant.name}: $${variant.price / 100} (ID: ${variant.id})\n`;
      });

      formattedText += "\n";
    });

    return {
      contents: [
        {
          uri: uri.href,
          text: formattedText,
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      contents: [
        {
          uri: uri.href,
          text: `Error fetching products: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Single product resource
server.resource("product", "terminal://product/{id}", async (uri, { id }) => {
  try {
    const response = await terminalApi.get(`/product/${id}`);
    const product = response.data.data;

    // Format the product details
    let formattedText = `# ${product.name}\n\n`;
    formattedText += `ID: ${product.id}\n\n`;
    formattedText += `## Description\n${product.description}\n\n`;

    // Add variants section
    formattedText += `## Available Variants\n`;
    product.variants.forEach((variant) => {
      formattedText += `### ${variant.name}\n`;
      formattedText += `- Price: $${variant.price / 100}\n`;
      formattedText += `- ID: ${variant.id}\n\n`;
    });

    // Add subscription info if available
    if (product.subscription) {
      formattedText += `## Subscription: ${product.subscription}\n\n`;
    }

    return {
      contents: [
        {
          uri: uri.href,
          text: formattedText,
        },
      ],
    };
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return {
      contents: [
        {
          uri: uri.href,
          text: `Error fetching product ${id}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Order history resource
server.resource("order-history", "terminal://orders", async (uri) => {
  try {
    const response = await terminalApi.get("/order");
    const orders = response.data.data;

    let formattedText = "# Your Order History\n\n";

    if (orders.length === 0) {
      formattedText += "You haven't placed any orders yet.";
    } else {
      orders.forEach((order) => {
        formattedText += `## Order ID: ${order.id}\n`;
        formattedText += `Order Index: ${order.index}\n\n`;

        // Shipping information
        formattedText += "### Shipping Information\n";
        formattedText += `Name: ${order.shipping.name}\n`;
        formattedText += `Address: ${order.shipping.street1}${order.shipping.street2 ? `, ${order.shipping.street2}` : ""}\n`;
        formattedText += `${order.shipping.city}, ${order.shipping.province || ""} ${order.shipping.zip}\n`;
        formattedText += `Country: ${order.shipping.country}\n`;
        if (order.shipping.phone)
          formattedText += `Phone: ${order.shipping.phone}\n`;
        formattedText += "\n";

        // Tracking information
        if (order.tracking) {
          formattedText += "### Tracking Information\n";
          formattedText += `Service: ${order.tracking.service}\n`;
          formattedText += `Tracking Number: ${order.tracking.number}\n`;
          formattedText += `Tracking URL: ${order.tracking.url}\n\n`;
        }

        // Items
        formattedText += "### Items\n";
        order.items.forEach((item) => {
          formattedText += `- Quantity: ${item.quantity}, Amount: $${item.amount / 100}, Variant ID: ${item.productVariantID}\n`;
        });

        // Amount
        formattedText += "\n### Order Totals\n";
        formattedText += `Subtotal: $${order.amount.subtotal / 100}\n`;
        formattedText += `Shipping: $${order.amount.shipping / 100}\n`;
        formattedText += `Total: $${(order.amount.subtotal + order.amount.shipping) / 100}\n\n`;
      });
    }

    return {
      contents: [
        {
          uri: uri.href,
          text: formattedText,
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching order history:", error);
    return {
      contents: [
        {
          uri: uri.href,
          text: `Error fetching order history: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// User profile resource
server.resource("profile", "terminal://profile", async (uri) => {
  try {
    const response = await terminalApi.get("/profile");
    const profile = response.data.data;

    let formattedText = "# Your Profile\n\n";
    formattedText += `Name: ${profile.user.name || "Not set"}\n`;
    formattedText += `Email: ${profile.user.email || "Not set"}\n`;
    formattedText += `User ID: ${profile.user.id}\n`;
    formattedText += `SSH Key Fingerprint: ${profile.user.fingerprint || "Not set"}\n`;
    formattedText += `Stripe Customer ID: ${profile.user.stripeCustomerID}\n`;

    return {
      contents: [
        {
          uri: uri.href,
          text: formattedText,
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return {
      contents: [
        {
          uri: uri.href,
          text: `Error fetching profile: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// User addresses resource
server.resource("addresses", "terminal://addresses", async (uri) => {
  try {
    const response = await terminalApi.get("/address");
    const addresses = response.data.data;

    let formattedText = "# Your Shipping Addresses\n\n";

    if (addresses.length === 0) {
      formattedText += "You don't have any saved addresses yet.";
    } else {
      addresses.forEach((address) => {
        formattedText += `## ${address.name}\n`;
        formattedText += `ID: ${address.id}\n`;
        formattedText += `${address.street1}\n`;
        if (address.street2) formattedText += `${address.street2}\n`;
        formattedText += `${address.city}, ${address.province || ""} ${address.zip}\n`;
        formattedText += `${address.country}\n`;
        if (address.phone) formattedText += `Phone: ${address.phone}\n`;
        formattedText += "\n";
      });
    }

    return {
      contents: [
        {
          uri: uri.href,
          text: formattedText,
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return {
      contents: [
        {
          uri: uri.href,
          text: `Error fetching addresses: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// User payment cards resource
server.resource("cards", "terminal://cards", async (uri) => {
  try {
    const response = await terminalApi.get("/card");
    const cards = response.data.data;

    let formattedText = "# Your Payment Methods\n\n";

    if (cards.length === 0) {
      formattedText += "You don't have any saved payment methods yet.";
    } else {
      cards.forEach((card) => {
        formattedText += `## ${card.brand} •••• ${card.last4}\n`;
        formattedText += `ID: ${card.id}\n`;
        formattedText += `Expires: ${card.expiration.month}/${card.expiration.year}\n\n`;
      });
    }

    return {
      contents: [
        {
          uri: uri.href,
          text: formattedText,
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching cards:", error);
    return {
      contents: [
        {
          uri: uri.href,
          text: `Error fetching cards: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Cart resource
server.resource("cart", "terminal://cart", async (uri) => {
  try {
    const response = await terminalApi.get("/cart");
    const cart = response.data.data;

    let formattedText = "# Your Shopping Cart\n\n";

    if (cart.items.length === 0) {
      formattedText += "Your cart is currently empty.";
    } else {
      formattedText += "## Cart Items\n";
      cart.items.forEach((item) => {
        formattedText += `- Quantity: ${item.quantity}, Variant ID: ${item.productVariantID}, Subtotal: $${item.subtotal / 100}\n`;
      });

      formattedText += "\n## Cart Summary\n";
      formattedText += `Subtotal: $${cart.subtotal / 100}\n`;

      if (cart.amount && cart.amount.shipping) {
        formattedText += `Shipping: $${cart.amount.shipping / 100}\n`;
        formattedText += `Total: $${(cart.amount.subtotal + cart.amount.shipping) / 100}\n`;
      }

      if (cart.addressID) {
        formattedText += `\nShipping Address ID: ${cart.addressID}\n`;
      }

      if (cart.cardID) {
        formattedText += `Payment Method ID: ${cart.cardID}\n`;
      }

      if (cart.shipping) {
        formattedText += `\n## Shipping\n`;
        formattedText += `Service: ${cart.shipping.service}\n`;
        formattedText += `Timeframe: ${cart.shipping.timeframe}\n`;
      }
    }

    return {
      contents: [
        {
          uri: uri.href,
          text: formattedText,
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching cart:", error);
    return {
      contents: [
        {
          uri: uri.href,
          text: `Error fetching cart: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Subscriptions resource
server.resource("subscriptions", "terminal://subscriptions", async (uri) => {
  try {
    const response = await terminalApi.get("/subscription");
    const subscriptions = response.data.data;

    let formattedText = "# Your Subscriptions\n\n";

    if (subscriptions.length === 0) {
      formattedText += "You don't have any active subscriptions.";
    } else {
      subscriptions.forEach((sub, index) => {
        formattedText += `## Subscription ${index + 1}\n`;
        formattedText += `ID: ${sub.id}\n`;
        formattedText += `Product Variant ID: ${sub.productVariantID}\n`;
        formattedText += `Quantity: ${sub.quantity}\n`;
        formattedText += `Shipping Address ID: ${sub.addressID}\n`;
        formattedText += `Payment Method ID: ${sub.cardID}\n`;

        if (sub.schedule) {
          formattedText += `\n### Schedule\n`;
          formattedText += `Type: ${sub.schedule.type}\n`;
          if (sub.schedule.interval) {
            formattedText += `Interval: Every ${sub.schedule.interval} ${sub.schedule.type === "weekly" ? "weeks" : "period"}\n`;
          }
        }

        if (sub.next) {
          formattedText += `Next Delivery: ${new Date(sub.next).toLocaleDateString()}\n`;
        }

        formattedText += "\n";
      });
    }

    return {
      contents: [
        {
          uri: uri.href,
          text: formattedText,
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return {
      contents: [
        {
          uri: uri.href,
          text: `Error fetching subscriptions: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Tool to search products
server.tool(
  "search-products",
  {
    query: z.string().optional(),
  },
  async ({ query = "" }) => {
    try {
      const response = await terminalApi.get("/product");
      const products = response.data.data;

      // Filter products if query is provided
      const filteredProducts = query
        ? products.filter(
            (p) =>
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.description.toLowerCase().includes(query.toLowerCase()),
          )
        : products;

      if (filteredProducts.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No products found matching "${query}".`,
            },
          ],
        };
      }

      // Format the response
      let formattedText = query
        ? `# Products matching "${query}"\n\n`
        : "# All Terminal.shop Products\n\n";

      filteredProducts.forEach((product) => {
        formattedText += `## ${product.name}\n`;
        formattedText += `ID: ${product.id}\n`;
        formattedText += `${product.description}\n\n`;

        formattedText += "### Variants:\n";
        product.variants.forEach((variant) => {
          formattedText += `- ${variant.name}: $${variant.price / 100} (ID: ${variant.id})\n`;
        });

        formattedText += "\n";
      });

      return {
        content: [
          {
            type: "text",
            text: formattedText,
          },
        ],
      };
    } catch (error) {
      console.error("Error searching products:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error searching products: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to get product details
server.tool(
  "get-product-details",
  {
    productId: z.string(),
  },
  async ({ productId }) => {
    try {
      const response = await terminalApi.get(`/product/${productId}`);
      const product = response.data.data;

      // Format the product details
      let formattedText = `# ${product.name}\n\n`;
      formattedText += `ID: ${product.id}\n\n`;
      formattedText += `## Description\n${product.description}\n\n`;

      // Add variants section
      formattedText += `## Available Variants\n`;
      product.variants.forEach((variant) => {
        formattedText += `### ${variant.name}\n`;
        formattedText += `- Price: $${variant.price / 100}\n`;
        formattedText += `- ID: ${variant.id}\n\n`;
      });

      // Add subscription info if available
      if (product.subscription) {
        formattedText += `## Subscription Options\n`;
        formattedText += `This product ${product.subscription === "required" ? "requires" : "allows"} subscription.\n\n`;
      }

      // Add tags if available
      if (product.tags && Object.keys(product.tags).length > 0) {
        formattedText += `## Product Tags\n`;
        Object.entries(product.tags).forEach(([key, value]) => {
          formattedText += `- ${key}: ${value}\n`;
        });
        formattedText += "\n";
      }

      return {
        content: [
          {
            type: "text",
            text: formattedText,
          },
        ],
      };
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching product details: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to add item to cart
server.tool(
  "add-to-cart",
  {
    productVariantID: z.string(),
    quantity: z.number().int().positive(),
  },
  async ({ productVariantID, quantity }) => {
    try {
      const response = await terminalApi.put("/cart/item", {
        productVariantID,
        quantity,
      });

      const cart = response.data.data;

      let formattedText = "# Item Added to Cart\n\n";
      formattedText += `Successfully added item to your cart.\n\n`;

      formattedText += "## Updated Cart\n";
      formattedText += `Items: ${cart.items.length}\n`;
      formattedText += `Subtotal: $${cart.subtotal / 100}\n`;

      if (cart.amount && cart.amount.shipping) {
        formattedText += `Shipping: $${cart.amount.shipping / 100}\n`;
        if (cart.amount.total) {
          formattedText += `Total: $${cart.amount.total / 100}\n`;
        } else {
          formattedText += `Total: $${(cart.amount.subtotal + cart.amount.shipping) / 100}\n`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: formattedText,
          },
        ],
      };
    } catch (error) {
      console.error("Error adding item to cart:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error adding item to cart: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to set shipping address on cart
server.tool(
  "set-cart-address",
  {
    addressID: z.string(),
  },
  async ({ addressID }) => {
    try {
      const response = await terminalApi.put("/cart/address", {
        addressID,
      });

      return {
        content: [
          {
            type: "text",
            text: "Successfully set shipping address for your cart.",
          },
        ],
      };
    } catch (error) {
      console.error("Error setting cart address:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error setting cart address: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to set payment method on cart
server.tool(
  "set-cart-card",
  {
    cardID: z.string(),
  },
  async ({ cardID }) => {
    try {
      const response = await terminalApi.put("/cart/card", {
        cardID,
      });

      return {
        content: [
          {
            type: "text",
            text: "Successfully set payment method for your cart.",
          },
        ],
      };
    } catch (error) {
      console.error("Error setting cart payment method:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error setting cart payment method: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to clear cart
server.tool("clear-cart", {}, async () => {
  try {
    const response = await terminalApi.delete("/cart");

    return {
      content: [
        {
          type: "text",
          text: "Your cart has been cleared successfully.",
        },
      ],
    };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error clearing cart: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Tool to convert cart to order
server.tool("checkout", {}, async () => {
  try {
    const response = await terminalApi.post("/cart/convert");
    const order = response.data.data;

    let formattedText = "# Order Placed Successfully!\n\n";
    formattedText += `Order ID: ${order.id}\n`;

    // Shipping information
    formattedText += "\n## Shipping Information\n";
    formattedText += `Name: ${order.shipping.name}\n`;
    formattedText += `Address: ${order.shipping.street1}${order.shipping.street2 ? `, ${order.shipping.street2}` : ""}\n`;
    formattedText += `${order.shipping.city}, ${order.shipping.province || ""} ${order.shipping.zip}\n`;
    formattedText += `Country: ${order.shipping.country}\n`;
    if (order.shipping.phone)
      formattedText += `Phone: ${order.shipping.phone}\n`;

    // Tracking information if available
    if (order.tracking) {
      formattedText += "\n## Tracking Information\n";
      formattedText += `Service: ${order.tracking.service}\n`;
      formattedText += `Tracking Number: ${order.tracking.number}\n`;
      formattedText += `Tracking URL: ${order.tracking.url}\n`;
    }

    // Order details
    formattedText += "\n## Order Details\n";
    order.items.forEach((item) => {
      formattedText += `- Quantity: ${item.quantity}, Amount: $${item.amount / 100}, Variant ID: ${item.productVariantID}\n`;
    });

    // Totals
    formattedText += "\n## Order Totals\n";
    formattedText += `Subtotal: $${order.amount.subtotal / 100}\n`;
    formattedText += `Shipping: $${order.amount.shipping / 100}\n`;
    formattedText += `Total: $${(order.amount.subtotal + order.amount.shipping) / 100}\n`;

    return {
      content: [
        {
          type: "text",
          text: formattedText,
        },
      ],
    };
  } catch (error) {
    console.error("Error during checkout:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error during checkout: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Tool to create direct order without using cart
server.tool(
  "create-order",
  {
    variants: z.record(z.string(), z.number()),
    addressID: z.string(),
    cardID: z.string(),
  },
  async ({ variants, addressID, cardID }) => {
    try {
      const response = await terminalApi.post("/order", {
        variants,
        addressID,
        cardID,
      });

      const orderID = response.data.data;

      return {
        content: [
          {
            type: "text",
            text: `Order created successfully! Order ID: ${orderID}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error creating order:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error creating order: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to update user profile
server.tool(
  "update-profile",
  {
    name: z.string().optional(),
    email: z.string().email().optional(),
  },
  async ({ name, email }) => {
    try {
      // Only include fields that are provided
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;

      const response = await terminalApi.put("/profile", updateData);
      const profile = response.data.data;

      return {
        content: [
          {
            type: "text",
            text: `Profile updated successfully:\nName: ${profile.user.name}\nEmail: ${profile.user.email}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error updating profile:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error updating profile: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to create a new shipping address
server.tool(
  "create-address",
  {
    name: z.string(),
    street1: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    province: z.string().optional(),
    country: z.string().length(2),
    zip: z.string(),
    phone: z.string().optional(),
  },
  async (params) => {
    try {
      const response = await terminalApi.post("/address", params);
      const addressID = response.data.data;

      return {
        content: [
          {
            type: "text",
            text: `Address created successfully! Address ID: ${addressID}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error creating address:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error creating address: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to delete an address
server.tool(
  "delete-address",
  {
    addressId: z.string(),
  },
  async ({ addressId }) => {
    try {
      await terminalApi.delete(`/address/${addressId}`);
      return {
        content: [
          {
            type: "text",
            text: `Address deleted successfully`,
          },
        ],
      };
    } catch (error) {
      console.error(`Error deleting address ${addressId}:`, error);
      return {
        content: [
          {
            type: "text",
            text: `Error deleting address: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to collect card information
server.tool("collect-card", {}, async () => {
  try {
    const response = await terminalApi.post("/card/collect");
    const data = response.data.data;

    return {
      content: [
        {
          type: "text",
          text: `Please use this URL to securely enter your card details: ${data.url}\nAfter completing the form, your card will be added to your account.`,
        },
      ],
    };
  } catch (error) {
    console.error("Error generating card collection URL:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error generating card collection URL: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Tool to create a card using Stripe token (for advanced usage)
server.tool(
  "create-card",
  {
    token: z.string(),
  },
  async ({ token }) => {
    try {
      const response = await terminalApi.post("/card", {
        token,
      });

      const cardID = response.data.data;

      return {
        content: [
          {
            type: "text",
            text: `Card created successfully! Card ID: ${cardID}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error creating card:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error creating card: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to delete a card
server.tool(
  "delete-card",
  {
    cardId: z.string(),
  },
  async ({ cardId }) => {
    try {
      await terminalApi.delete(`/card/${cardId}`);
      return {
        content: [
          {
            type: "text",
            text: `Card deleted successfully`,
          },
        ],
      };
    } catch (error) {
      console.error(`Error deleting card ${cardId}:`, error);
      return {
        content: [
          {
            type: "text",
            text: `Error deleting card: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to create a subscription
server.tool(
  "create-subscription",
  {
    productVariantID: z.string(),
    quantity: z.number().int().positive(),
    addressID: z.string(),
    cardID: z.string(),
    schedule: z.object({
      type: z.enum(["fixed", "weekly"]),
      interval: z.number().int().positive().optional(),
    }),
  },
  async ({ productVariantID, quantity, addressID, cardID, schedule }) => {
    try {
      const response = await terminalApi.post("/subscription", {
        productVariantID,
        quantity,
        addressID,
        cardID,
        schedule,
      });

      return {
        content: [
          {
            type: "text",
            text: `Subscription created successfully!`,
          },
        ],
      };
    } catch (error) {
      console.error("Error creating subscription:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error creating subscription: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to cancel a subscription
server.tool(
  "cancel-subscription",
  {
    subscriptionId: z.string(),
  },
  async ({ subscriptionId }) => {
    try {
      await terminalApi.delete(`/subscription/${subscriptionId}`);
      return {
        content: [
          {
            type: "text",
            text: `Subscription canceled successfully`,
          },
        ],
      };
    } catch (error) {
      console.error(`Error canceling subscription ${subscriptionId}:`, error);
      return {
        content: [
          {
            type: "text",
            text: `Error canceling subscription: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to create a personal access token
server.tool("create-token", {}, async () => {
  try {
    const response = await terminalApi.post("/token");
    const data = response.data.data;

    return {
      content: [
        {
          type: "text",
          text: `Token created successfully!\n\nToken ID: ${data.id}\nToken: ${data.token}\n\nIMPORTANT: Save this token securely. You won't be able to see the full token value again.`,
        },
      ],
    };
  } catch (error) {
    console.error("Error creating token:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error creating token: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Tool to delete a token
server.tool(
  "delete-token",
  {
    tokenId: z.string(),
  },
  async ({ tokenId }) => {
    try {
      await terminalApi.delete(`/token/${tokenId}`);
      return {
        content: [
          {
            type: "text",
            text: `Token deleted successfully`,
          },
        ],
      };
    } catch (error) {
      console.error(`Error deleting token ${tokenId}:`, error);
      return {
        content: [
          {
            type: "text",
            text: `Error deleting token: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Tool to fetch all app data at once (for initialization)
server.tool("get-app-data", {}, async () => {
  try {
    const response = await terminalApi.get("/view/init");
    const data = response.data.data;

    let formattedText = "# Terminal.shop Account Overview\n\n";

    // Profile
    formattedText += "## Your Profile\n";
    formattedText += `Name: ${data.profile.user.name || "Not set"}\n`;
    formattedText += `Email: ${data.profile.user.email || "Not set"}\n`;
    formattedText += `Region: ${data.region}\n\n`;

    // Cart
    formattedText += "## Your Cart\n";
    if (data.cart.items.length === 0) {
      formattedText += "Your cart is empty.\n\n";
    } else {
      formattedText += `Items in cart: ${data.cart.items.length}\n`;
      formattedText += `Cart subtotal: $${data.cart.subtotal / 100}\n\n`;
    }

    // Orders
    formattedText += "## Recent Orders\n";
    if (data.orders.length === 0) {
      formattedText += "You haven't placed any orders yet.\n\n";
    } else {
      formattedText += `You have ${data.orders.length} order(s).\n\n`;
    }

    // Subscriptions
    formattedText += "## Subscriptions\n";
    if (data.subscriptions.length === 0) {
      formattedText += "You don't have any active subscriptions.\n\n";
    } else {
      formattedText += `You have ${data.subscriptions.length} active subscription(s).\n\n`;
    }

    // Products
    formattedText += "## Available Products\n";
    formattedText += `${data.products.length} products available in the shop.\n\n`;

    return {
      content: [
        {
          type: "text",
          text: formattedText,
        },
      ],
    };
  } catch (error) {
    console.error("Error getting app data:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error getting app data: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Prompts
server.prompt(
  "browse-products",
  {
    searchTerm: z.string().optional(),
  },
  ({ searchTerm = "" }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: searchTerm
            ? `I'm interested in browsing Terminal.shop products related to "${searchTerm}". Could you show me what's available and help me find something I might like?`
            : "I'd like to browse the products available from Terminal.shop. Could you show me what coffee options they have and help me find something I might like?",
        },
      },
    ],
  }),
);

server.prompt("manage-cart", {}, () => ({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: "I want to manage my shopping cart at Terminal.shop. Can you show me what's in my cart, help me add or remove items, and guide me through the checkout process?",
      },
    },
  ],
}));

server.prompt(
  "place-order",
  {
    productName: z.string().optional(),
  },
  ({ productName }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: productName
            ? `I'd like to order some ${productName} from Terminal.shop. Can you help me place this order?`
            : "I want to place an order on Terminal.shop. Can you help me select products and complete my purchase?",
        },
      },
    ],
  }),
);

server.prompt("manage-subscription", {}, () => ({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: "I'd like to view and manage my coffee subscriptions from Terminal.shop. Can you show me my active subscriptions and the options available?",
      },
    },
  ],
}));

server.prompt("manage-profile", {}, () => ({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: "I want to manage my Terminal.shop profile, including my shipping addresses and payment methods. Can you help me with that?",
      },
    },
  ],
}));

// Connect and start the server
async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Terminal.shop MCP server started");
}

startServer().catch(console.error);
