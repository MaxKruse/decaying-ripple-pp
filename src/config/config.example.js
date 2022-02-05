export class Config {
    static HOST = 'localhost';
    static PORT = 3000;

    // Oauth2 config
    // See: https://docs.ripple.moe/docs/api/appendix#oauth
    static CLIENT_ID = '';
    static CLIENT_SECRET = '';
    static AUTHORIZATION_URL = 'https://ripple.moe/oauth/authorize';
    static ACCESS_TOKEN_URI = 'https://ripple.moe/oauth/token';
    static REDIRECT_ENDPOINT = '/oauth2/callback';
    static REDIRECT_URI = `http://${this.HOST}:${this.PORT}/oauth2/callback`;

    static SCOPES = ['read_confidential'];

    static RESSOURCE_OWNER = 'https://ripple.moe/api/v1/ping';

}