const jwt = require('jsonwebtoken')

const authenticateJWT = (req, res, next) => {
    try {
        const decoded = jwt.verify(res.cookies.funds, process.env.JWT_SECRET)
        req.user = decoded
        
    } catch (error) {
        res.user = false
        
    }
    res.locals.user = req.user
    console.log(req.user)

    next()
}

module.exports = {authenticateJWT}