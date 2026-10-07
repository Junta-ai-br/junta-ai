import auth0 from 'auth0-js';

export const webAuth = new auth0.WebAuth({
  domain: import.meta.env.VITE_AUTH0_DOMAIN, 
  clientID: import.meta.env.VITE_AUTH0_CLIENT_ID,
  
  // ATENÇÃO: Verifique no seu terminal se o Vite está rodando na 5173
  redirectUri: 'http://localhost:5173/callback', 
  
  responseType: 'token id_token',
  scope: 'openid profile email'
});