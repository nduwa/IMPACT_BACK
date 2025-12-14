import axios from 'axios';
import https from 'https';

class Auth {
    static tokenUrl = 'https://rtc.kizasolutions.com/fmi/data/vLatest/databases/EMS/sessions';

    static credentials = {
        username: process.env.API_USERNAME || 'APIUser', // Use environment variable or fallback
        password: process.env.API_PASSWORD || 'Oycvz^y6W1<LCz8>e[!d' // Use environment variable or fallback
    };

    static async getBearerToken() {
        try {
            console.log('Using credentials:', Auth.credentials); // Log credentials for debugging

            const response = await axios.post(Auth.tokenUrl, {}, {
                headers: { 'Content-Type': 'application/json' },
                auth: Auth.credentials,
                httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Temporary workaround
            });

            const token = response.data?.response?.token;
            if (!token) {
                throw new Error('Token not found in the response.');
            }

            console.log('Bearer token retrieved:', token); // Log the token for confirmation
            return token;
        } catch (error) {
            const errorMessage = error.response 
                ? `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}` 
                : error.message;
            throw new Error(`Failed to fetch Bearer token: ${errorMessage}`);
        }
    }
}

export default Auth;
