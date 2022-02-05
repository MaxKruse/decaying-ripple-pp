// imports
import ClientOAuth2 from "client-oauth2";
import express from "express";
import fetch from 'node-fetch';

// Own config
import { Config } from "./config/config.js";

// Create the express app
const app = express();


// --------------------------------------------------

// Create oauth2 client
const rippleAuth = new ClientOAuth2({
    clientId: Config.CLIENT_ID,
    clientSecret: Config.CLIENT_SECRET,
    accessTokenUri: Config.ACCESS_TOKEN_URI,
    authorizationUri: Config.AUTHORIZATION_URL,
    redirectUri: Config.REDIRECT_URI,
    scopes: Config.SCOPES
});


// --------------------------------------------------

// Oauth2 Login Route
app.get('/oauth2/login', (req, res) => {
    const url = rippleAuth.code.getUri();
    res.redirect(url);
});

// helper function to use the access token for fetch
async function authorizedFetch(url, token, options = {}) {
    const headers = {
        'Authorization': `Bearer ${token.accessToken}`
    }

    const response = await fetch(url, {
        headers: headers,
        ...options
    })
    return await response.json();
}

function degradedPerformance(pp, time_since) {
    // get today in days from unix
    const today = Math.floor(Date.now() / 1000 / 60 / 60 / 24);
    // get time since in days
    const time_since_days = today - Math.floor((new Date(time_since)) / 1000 / 60 / 60 / 24);

    // Max decay reached at 365 days
    const time_since_clamped = Math.min(time_since_days, 365);

    // Calculate decay
    const decay = 0.50 ** (time_since_clamped / 365);
    const decayed = pp * decay;

    return decayed;
}

async function calculatePPv3(user_id, token) {
    const user_scores = await authorizedFetch(`https://ripple.moe/api/v1/get_user_best?limit=100&u=${user_id}`, token);

    let scoreCount = 0;

    const total_from_scores_before = user_scores.reduce((sum, score) => {
        scoreCount++;
        return sum + ( parseFloat(score.pp) * Math.pow(0.95, scoreCount) );
    }, 0.0);

    const adjusted_scores = user_scores.map(score => {
        return {
            pp: degradedPerformance(score.pp, score.date)
        }
    });

    scoreCount = 0;

    const total_after = adjusted_scores.reduce((sum, score) => {
        scoreCount++;
        return sum + ( parseFloat(score.pp) * Math.pow(0.95, scoreCount) );
    }, 0);

    return {
        user: user_id,
        before: total_from_scores_before,
        after: total_after
    };
}

// oauth2 callback route
app.get(Config.REDIRECT_ENDPOINT, async (req, res) => {
    
    const token = await rippleAuth.code.getToken(req.originalUrl).catch(err => { console.log(err) });
    
    try {
        token.sign({
            url: 'https://ripple.moe/api/v1',
            method: 'GET'
        })
    } catch (e) {
        console.log(e);
    }

    const data = await authorizedFetch(Config.RESSOURCE_OWNER, token);

    if (data.code !== 200) {
        res.send(data);
    }

    console.log("Calculating ppv3 for user: " + data.user_id);
    const ppv3 = await calculatePPv3(data.user_id, token);

    return res.send(ppv3);
});

// run the server
app.listen(Config.PORT, () => {
    console.log(`Server running on http://${Config.HOST}:${Config.PORT}`);
});