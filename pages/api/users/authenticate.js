const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
import getConfig from 'next/config';
import { apiHandler, usersRepo } from 'helpers/api';
import { Auth } from 'aws-amplify';

const { serverRuntimeConfig } = getConfig();

export default apiHandler({
    post: authenticate
});

// function authenticate(req, res) {
//     const { username, password } = req.body;
//     const user = usersRepo.find(u => u.username === username);

//     // validate
//     if (!(user && bcrypt.compareSync(password, user.hash))) {
//         throw 'Username or password is incorrect';
//     }

//     // create a jwt token that is valid for 7 days
//     const token = jwt.sign({ sub: user.id }, serverRuntimeConfig.secret, { expiresIn: '7d' });

//     // return basic user details and token
//     return res.status(200).json({
//         id: user.id,
//         username: user.username,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         token
//     });
// }

async function authenticate(req, res) {
    const { username, password } = req.body;

    let user;

    try {
        user = await Auth.signIn(username, password);
        
    } catch (error) {
        throw 'Username or password is incorrect';
    }

    // create a jwt token that is valid for 7 days
    // const token = jwt.sign({ sub: user.id }, serverRuntimeConfig.secret, { expiresIn: '7d' });

    const token = user.signInUserSession.accessToken.jwtToken;

    // return basic user details and token
    return res.status(200).json({
        // id: user.id,
        username: user.username,
        // firstName: user.firstName,
        // lastName: user.lastName,
        token
    });
}
