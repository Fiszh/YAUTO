const CLIENT_ID = '11pghkhf9gq7dke49sw1pmumjcthma';
const REDIRECT_URI = 'https://chat.unii.dev/';
const AUTH_URL = 'https://id.twitch.tv/oauth2/authorize';

const SCOPES = 'user:read:email';

const authButton = document.getElementById('login-button');

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

let accessToken = getCookie('twitch_access_token');
let userToken = `Bearer ${accessToken}`

if (!accessToken) {
    userToken = undefined;
}

async function handleToken() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
        try {
            setCookie('twitch_access_token', accessToken, 60);

            if (authButton) {
                authButton.textContent = 'Logout';
            }

            const userDataResponse = await fetch('https://id.twitch.tv/oauth2/validate', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            });

            if (userDataResponse.ok) {
                const userData = await userDataResponse.json();
                console.log('User Data:', userData);

                window.location.href = REDIRECT_URI;
            } else {
                throw new Error('Failed to fetch user data');
            }
        } catch (error) {
            console.error('Error processing access token:', error);
        }
    } else {

    }
}

handleToken();

async function checkLoginStatus() {
    const accessToken = getCookie('twitch_access_token');
    const authButton = document.getElementById('login-button');

    if (accessToken) {
        try {
            const response = await fetch('https://id.twitch.tv/oauth2/validate', {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Error validating your accessToken');
            }

            const data = await response.json();

            const requiredScopes = SCOPES.split(' ');

            const hasAllScopes = requiredScopes.every(scope => data.scopes.includes(scope));

            if (!hasAllScopes) {
                deleteCookie('twitch_access_token');
                authButton.textContent = 'Login';

                const missingScopes = requiredScopes.filter(scope => !data.scopes.includes(scope));
                alert(`Missing scopes: ${missingScopes.join(', ')}. Please log in again.`);
            } else {
                authButton.textContent = 'Logout';
            }
        } catch (error) {
            console.error('Error checking login status:', error.message);
        }
    } else {
        authButton.textContent = 'Login';
    }
}

checkLoginStatus();

if (authButton) {
    authButton.addEventListener('click', async () => {
        const accessToken = getCookie('twitch_access_token');
        if (accessToken) {
            deleteCookie('twitch_access_token');
            authButton.textContent = 'Login';
        } else {
            const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${encodeURIComponent(SCOPES)}`;
            window.location = authUrl;
        }
    });
}