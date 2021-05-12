const router = require('express').Router({ mergeParams: true });
const { validationResult, header } = require('express-validator');
const fs = require('fs');
var path = require('path');
const jwt = require('jsonwebtoken');

const privateKey = fs.readFileSync("/etc/letsencrypt/live/direct.anondraw.com/private.key");

const SELECT_QUERY = "SELECT BIN_TO_UUID(uuid) as uuid, BIN_TO_UUID(useruuid) as useruuid, name, description, creation, updatedatetime from  `plugins` WHERE useruuid = UUID_TO_BIN(?)";

const GENERIC_DB_ERROR = {
    errors: [{
        msg: "Internal database error"
    }]
};

const JWT_ERROR = {
    errors: [{
        msg: "Jwt decode failed"
    }]
};

module.exports = (database) => {
    router.get('/', [
        header('authorization'),
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let useruuid
        try {
            console.log(req.headers.authorization)
            console.log(req.headers.authorization.split(' '))
            console.log(privateKey)
            useruuid = jwt.verify(req.headers.authorization.split(' ')[1], privateKey)
        } catch (error) {
            console.log(error)
            return res.status(401).json(JWT_ERROR);
        }

        database.query(SELECT_QUERY, [useruuid.uuid], (err, result) => {
            if (err) {
                console.log("Retrieve plugin database error", err);
                return res.status(504).json(GENERIC_DB_ERROR);
            }

            return res.status(200).json({
                plugins: result
            });
        });
    });

    return router;
};
