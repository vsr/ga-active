/**
 * Cloud Function that fetches the real-time active users from a GA4 property.
 * * To deploy:
 * gcloud functions deploy getGa4RealtimeUsers \
 * --runtime nodejs20 \
 * --trigger-http \
 * --allow-unauthenticated \
 * --set-env-vars GA4_PROPERTY_ID=<YOUR_GA4_PROPERTY_ID>
 * * Note: Authentication is automatically handled by the Cloud Function's Service Account.
 * Ensure the Service Account has the "Google Analytics Reader" role on your GA4 property.
 */

// Import the Google Analytics Data API client
const { BetaAnalyticsDataClient } = require("@google-analytics/data");

// Get the GA4 Property ID from the environment variables
const PROPERTY_IDS = process.env.GA4_PROPERTY_IDS ? process.env.GA4_PROPERTY_IDS.split(',') : [];

// Instantiate a client with Application Default Credentials (ADC)
// ADC is automatically used by Cloud Functions to authenticate with the API.
const analyticsDataClient = new BetaAnalyticsDataClient();

/**
 * HTTP Cloud Function to get real-time active users from GA4.
 *
 * @param {object} req Cloud Function request context.
 * @param {object} res Cloud Function response context.
 */
exports.getGa4RealtimeUsers = async (req, res) => {
  const propertyId = req.query.propertyId;
  if (!propertyId) {
    res
      .status(400)
      .send(
        "Missing propertyId parameter."
      );
    return;
  }
  // Set CORS headers for all responses (optional, for web frontend use)
  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

  if (!PROPERTY_IDS.includes(propertyId)) {
    console.error("Invalid propertyId.", propertyId, PROPERTY_IDS);
    res.status(500).send(`Invalid propertyId: ${propertyId}.`);
    return;
  }

  try {
    const apiRequest = {
      property: `properties/${propertyId}`,
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      // Optional: Add a dimension like 'country' if you want a breakdown
      // dimensions: [{ name: 'country' }],
    };

    const [response] = await analyticsDataClient.runRealtimeReport(apiRequest);

    let activeUsers = 0;

    if (response.rows && response.rows.length > 0) {
      const metricValue = response.rows[0].metricValues[0];
      activeUsers = parseInt(metricValue ? metricValue.value : "0", 10);
    }
    res.set("Cache-Control", "max-age=15, s-maxage=30"); // Cache for 15 seconds on client, 30 seconds on CDN
    res.status(200).json({
      activeUsers: activeUsers,
      propertyId: propertyId,
      timestamp: new Date().toISOString(),
      // Optionally return the full response for debugging
    //   fullResponse: response,
    });
  } catch (error) {
    console.error("GA4 API call failed:", error);
    res.status(500).send(`Error fetching GA4 data: ${error.message}`);
  }
};
