# GA Realtime active user count

This is a Google Cloud Function that provides an HTTP endpoint to fetch the realtime active user count for one or more Google Analytics 4 (GA4) properties.

## Prerequisites

- Node.js (v20 or later)
- A Google Cloud Platform project with billing enabled.
- Google Cloud SDK (`gcloud` CLI) installed and authenticated.
- One or more Google Analytics 4 properties.

## Deployment & Configuration

Follow these steps to deploy the function and configure the necessary permissions.

### Step 1: Enable Required API

You must enable the Google Analytics Data API for your project.

-   In the Google Cloud Console, navigate to **APIs & Services** > **Library**.
-   Search for "Google Analytics Data API" and click **Enable**.

### Step 2: Deploy the Cloud Function

1.  Clone this repository (if you haven't already).
2.  Open your terminal and navigate to the project root.
3.  Run the following command to deploy the function. Replace `<YOUR_GA4_PROPERTY_IDS>` with a comma-separated list of your GA4 Property IDs (e.g., `12345,67890`).

    ```bash
    gcloud functions deploy getGa4RealtimeUsers \
      --runtime nodejs20 \
      --trigger-http \
      --allow-unauthenticated \
      --set-env-vars GA4_PROPERTY_ID=<YOUR_GA4_PROPERTY_IDS>
    ```

    > **Note:** The `--allow-unauthenticated` flag makes the function publicly accessible. If you want to secure it, you'll need to remove this flag and configure authentication (e.g., via IAM).

### Step 3: Grant Analytics Access to the Service Account

Once deployed, the Cloud Function runs with a specific service account identity. You need to grant this identity `Viewer` access to your Google Analytics properties.

1.  After deployment, find the service account email. Go to the Cloud Functions page in the GCP console, click on `getGa4RealtimeUsers`, and go to the **Details** tab. The service account email is listed under "Runtime service account".
2.  Go to your Google Analytics property.
3.  Navigate to **Admin** (bottom-left gear icon) > **Property Access Management**.
4.  Click the `+` button and select **Add users**.
5.  Paste the service account email address you noted in the first step.
6.  Assign it the **Viewer** role.
7.  Ensure "Notify new users by email" is unchecked and click **Add**.
8.  Repeat for all GA4 properties you want to access.

## Usage

1.  Find the trigger URL for your deployed function on the Cloud Functions page. It will look something like `https://<REGION>-<PROJECT_ID>.cloudfunctions.net/getGa4RealtimeUsers`.
2.  To get the active user count, make a GET request to the URL with a `propertyId` query parameter.

    **Example Request:**
    ```
    https://<YOUR_FUNCTION_URL>/getGa4RealtimeUsers?propertyId=123456789
    ```

    **Example Success Response:**
    ```json
    {
      "propertyId": "123456789",
      "activeUsers": 42
    }
    ```

## Local Development

You can also run this function on your local machine for development and testing.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Create a Service Account Key:**
    For local authentication, it's best to use a JSON key file.
    -   Follow the GCP documentation to create and download a service account key.
    -   Grant this service account **Viewer** access to your GA properties as described in **Step 3** above.

3.  **Set Environment Variables:**
    Create a `.env` file in the project root and add the following:
    ```
    # The absolute path to your downloaded service account JSON key
    GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/keyfile.json"

    # Comma-separated list of your GA4 Property IDs
    GA4_PROPERTY_ID="12345,67890"
    ```

4.  **Run the Function Locally:**
    The Functions Framework allows you to run the function as a local web server.

    ```bash
    npm start
    ```

    The function will be available at `http://localhost:8080`. You can test it using a URL like: `http://localhost:8080/?propertyId=12345`.
    -   In the Google Cloud Console, go to **APIs & Services** > **Library**.
    -   Search for "Google Analytics Data API" and **Enable** it for your project.
