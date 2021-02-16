const bcrypt = require('bcryptjs');

module.exports = {
    register: async (req, res) => {
        const {username, password, profile_pic} = req.body;
        const db = req.app.get('db');
        const result = await db.user.find_user_by_username([username]);
        const existingUser = result[0];
        if (existingUser) {
            return res.status(409).send('Username taken')
        }
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        const registeredUser = await db.user.create_user([username, hash, profile_pic]);
        const user = registeredUser[0];
        req.session.user = {
            id: user.id, 
            username: user.username, 
            password: user.password, 
            profile_pic: `https://robohash.org/${username}.png`}
        return res.status(201).send(req.session.user);
    },
    login: async (req, res) => {
        const {username, password} = req.body;
        const db = req.app.get('db');
        const foundUser = await db.user.find_user_by_username([username]);
        const user = foundUser[0];
        if (!user) {
            return res.status(410).send('User not found.')
        }
        const isAuthenticated = bcrypt.compareSync(password, user.password);
        if (!isAuthenticated) {
            return res.status(403).send('Incorrect password');
        }
        req.session.user = {id: user.id, username: user.username, profile_pic: `https://robohash.org/${username}.png`}
        return res.status(200).send(req.session.user);
    },
    logout: async (req, res) => {
        req.session.destroy();
        return res.sendStatus(200)
    },
    getUser: async (req, res) => {
        if(req.session.user) {
            return res.status(200).send(req.session.user)
        }
        res.sendStatus(404)
    }
}