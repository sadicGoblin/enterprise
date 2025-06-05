const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Proxy for API requests to solve mixed content issues
exports.apiProxy = functions.https.onRequest((request, response) => {
  return cors(request, response, async () => {
    try {
      // Get the API endpoint from the path
      const endpoint = request.path.substring(1); // Remove leading slash
      
      // Base URL for the API
      const apiBaseUrl = 'http://raam-hosting.cl/apissoma/ws';
      
      // Full URL to forward the request to
      const apiUrl = `${apiBaseUrl}/${endpoint}`;
      
      console.log(`Proxying request to: ${apiUrl}`);
      
      // Forward the request to the API
      const apiResponse = await axios({
        method: request.method,
        url: apiUrl,
        data: request.body,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Return the API response
      response.status(apiResponse.status).send(apiResponse.data);
    } catch (error) {
      console.error('API proxy error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        response.status(error.response.status).send(error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        response.status(500).send({ error: 'No response received from API' });
      } else {
        // Something happened in setting up the request that triggered an Error
        response.status(500).send({ error: error.message });
      }
    }
  });
});
