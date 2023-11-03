import { BehaviorSubject } from 'rxjs';
import getConfig from 'next/config';
import Router from 'next/router';

import { fetchWrapper } from 'helpers';

import { Auth } from 'aws-amplify';

import output from '/cdk/cdk-outputs.json' //endpoint and API key values exported by CDK deploy

const endpoint = output.CdkStack.GraphQLAPIEndpoint;
const apiKey = output.CdkStack.GraphQLAPIKey;

const { publicRuntimeConfig } = getConfig();
const baseUrl = `${publicRuntimeConfig.apiUrl}/users`;
const userSubject = new BehaviorSubject(process.browser && JSON.parse(localStorage.getItem('user')));

export const userService = {
    user: userSubject.asObservable(),
    get userValue () { return userSubject.value },
    login,
    logout,
    register,
    confirm,
    resend,
    add,
    getAll,
    getById,
    update,
    delete: _delete
};

async function login(username, password) {
    // return fetchWrapper.post(`${baseUrl}/authenticate`, { username, password })
    //     .then(user => {
    //         // publish user to subscribers and store in local storage to stay logged in between page refreshes
    //         userSubject.next(user);
    //         localStorage.setItem('user', JSON.stringify(user));

    //         return user;
    //     });

    let response;

    try {
        response = await Auth.signIn(username, password);
        
    } catch (error) {
        throw 'Username or password is incorrect';
    }

    const token = response.signInUserSession.accessToken.jwtToken;

    // return basic user details and token
    const user = {
        username: response.username,
        token
    };

    userSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
}

async function logout() {
    // remove user from local storage, publish null to user subscribers and redirect to login page
    await Auth.signOut();

    localStorage.removeItem('user');
    userSubject.next(null);
    Router.push('/account/login');
}

// function register(user) {
//     return fetchWrapper.post(`${baseUrl}/register`, user);
// }

async function register(user) {
    const userSchema = {
        'username': user.username,
        'password': user.password,
        'attributes': {
            'email': user.email
        }
    }

    let response;

    try {
        response = await Auth.signUp(userSchema);
        
    } catch (error) {
        console.log("error: ", error)
        if (error == "UsernameExistsException: User already exists")
            throw 'User already exists';
        else
            throw error;
    }

    console.log("response: ",response)

    return {};
}

async function confirm(username, code) {
    let response;

    try {
        response = await Auth.confirmSignUp(username, code);
        
    } catch (error) {
        if (error == "CodeMismatchException: Invalid verification code provided, please try again.")
            throw 'Invalid verification code provided, please try again.';
        else
            throw error;
    }

    console.log("response: ",response)

    return {};
}

async function resend(username) {
    let response;

    try {
        response = await Auth.resendSignUp(username);
        
    } catch (error) {
        throw error;
    }

    console.log("response: ",response)

    return {};
}

function add(user) {
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({
            query: `mutation addHero {
                addHero(
                    hero_name: "${user.heroName}"
                    powers: "${user.powers}"
                    backstory: "${user.backstory}"
                ) {
                    hero_name
                }
            }`
        }),
    };

    return fetch(endpoint, requestOptions).then(handleResponse);
}

// function getAll() {
//     return fetchWrapper.get(baseUrl);
// }

function getAll() {
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({
            query: `query allHeroes {
                allHeroes(count: 50) {
                    heroes {
                        id
                        hero_name
                        powers
                        backstory
                    }
                    nextToken
                }
            }`,
        }),
    };

    return fetch(endpoint, requestOptions).then(handleResponse);
}

// function getById(id) {
//     return fetchWrapper.get(`${baseUrl}/${id}`);
// }

function getById(id) {
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({
        query: `query getHero {
                getHero(id: "${id}") {
                    id
                    hero_name
                    powers
                    backstory
                }
            }`,
        }),
    };

    return fetch(endpoint, requestOptions).then(handleResponse);
}

// function update(id, params) {
//     return fetchWrapper.put(`${baseUrl}/${id}`, params)
//         .then(x => {
//             // update stored user if the logged in user updated their own record
//             if (id === userSubject.value.id) {
//                 // update local storage
//                 const user = { ...userSubject.value, ...params };
//                 localStorage.setItem('user', JSON.stringify(user));

//                 // publish updated user to subscribers
//                 userSubject.next(user);
//         }
//         return x;
//     });
// }

function update(id, params) {
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({
        query: `mutation updateHero {
                updateHero(
                id: "${id}"
                hero_name: "${params.heroName}"
                powers: "${params.powers}"
                backstory: "${params.backstory}"
            ) {
                hero_name
            }}`
        }),
    };

    return fetch(endpoint, requestOptions).then(handleResponse);
}

// prefixed with underscore because delete is a reserved word in javascript
// function _delete(id) {
//     return fetchWrapper.delete(`${baseUrl}/${id}`);
// }

function _delete(id) {
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({
        query: `mutation deleteHero {
                    deleteHero(id:"${id}") {
                    id
                    hero_name
                    powers
                    backstory
                }
            }`
        }),
    };

    return fetch(endpoint, requestOptions).then(handleResponse);
}

function handleResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        
        if (!response.ok) {
            if ([401, 403].includes(response.status) && userService.userValue) {
                // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
                userService.logout();
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        // return 'allHeroes' in data.data ? data.data.allHeroes.heroes : data

        let result;

        if ('allHeroes' in data.data) {
            result = data.data.allHeroes.heroes;
        }

        else if ('getHero' in data.data) {
            result = data.data.getHero;
        }

        else {
            result = data;
        }

        return result;          
    });
}
