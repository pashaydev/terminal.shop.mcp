# Terminal.shop MCP Server

This project implements a Model Context Protocol (MCP) server for interacting with the Terminal.shop e-commerce platform. It allows AI assistants to seamlessly browse products, manage shopping carts, place orders, and handle subscriptions through Terminal.shop's API.

## Features

- **Product Management**: Browse and search Terminal.shop's coffee products
- **Cart Operations**: Add items to cart, set shipping address and payment method
- **Order Management**: Place orders and view order history
- **Subscription Handling**: Create and manage recurring coffee subscriptions
- **User Profile**: Update user information and manage shipping addresses
- **Payment Methods**: Secure handling of payment information

## Setup

### Prerequisites

- Node.js (v14 or higher)
- A Terminal.shop account
- A Terminal.shop API token

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Terminal.shop API token:
   ```
   TERMINAL_API_TOKEN=your_token_here
   ```

## Usage

Start the MCP server:

```bash
node index.js
```

The server will communicate through stdin/stdout as per the MCP protocol specification.

## Available Resources

The MCP server provides the following resources:

- `terminal://products` - List all available products
- `terminal://product/{id}` - Get details for a specific product
- `terminal://orders` - View order history
- `terminal://profile` - Access user profile information
- `terminal://addresses` - Manage shipping addresses
- `terminal://cards` - Manage payment methods
- `terminal://cart` - View current shopping cart
- `terminal://subscriptions` - Manage coffee subscriptions

## Tools

The server provides various tools for interacting with Terminal.shop:

### Product Tools
- `search-products` - Search for products by keyword
- `get-product-details` - Get detailed information about a specific product

### Cart Tools
- `add-to-cart` - Add a product variant to the cart
- `set-cart-address` - Set the shipping address for the cart
- `set-cart-card` - Set the payment method for the cart
- `clear-cart` - Empty the shopping cart
- `checkout` - Convert the cart to an order

### Order Tools
- `create-order` - Create an order directly without using the cart

### User Management Tools
- `update-profile` - Update user profile information
- `create-address` - Add a new shipping address
- `delete-address` - Remove a shipping address
- `collect-card` - Generate a secure URL for adding payment information
- `create-card` - Add a card using a Stripe token
- `delete-card` - Remove a payment method

### Subscription Tools
- `create-subscription` - Start a new coffee subscription
- `cancel-subscription` - Cancel an existing subscription

### Account Tools
- `create-token` - Create a new personal access token
- `delete-token` - Delete a personal access token
- `get-app-data` - Fetch all account data at once

## Prompt Templates

The server includes several prompt templates to help AI assistants provide better responses:

- `browse-products` - Guide for browsing and finding products
- `manage-cart` - Help with shopping cart management
- `place-order` - Assistance with placing an order
- `manage-subscription` - Support for subscription management
- `manage-profile` - Guide for profile and address management

## API Documentation

This MCP server is built on top of the Terminal.shop API. For detailed information about the underlying API, refer to the Terminal API documentation.

## Security Considerations

- The server handles sensitive payment information through secure URLs rather than directly processing card details
- API tokens are stored in environment variables to prevent exposure
- User data is handled according to Terminal.shop's security practices

## Error Handling

All API interactions include proper error handling to provide clear feedback when operations fail. Errors are logged to stderr for debugging purposes while maintaining the MCP protocol communication through stdout.

## Contributing

Contributions to improve the MCP server are welcome. Please ensure that any changes maintain compatibility with the Terminal.shop API specification.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Terminal.shop for providing the e-commerce platform and API
- The Model Context Protocol for enabling AI assistants to interact with external services
