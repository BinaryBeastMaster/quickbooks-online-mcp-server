
import { quickbooksClient } from './clients/quickbooks-client.js';

console.log("Starting manual auth flow...");
quickbooksClient.authenticate()
    .then(() => {
        console.log("Authentication successful!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Authentication failed:", err);
        process.exit(1);
    });
