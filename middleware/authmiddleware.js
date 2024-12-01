const jwt = require('jsonwebtoken');

// Middleware for authenticating JWT
const authenticateJWT = (req, res, next) => {
    try {
        const decoded = jwt.verify(req.cookies.funds, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (error) {
        req.user = false;
    }
    res.locals.user = req.user;
    console.log(req.user);

    next();
};

// Middleware for authorizing specific roles
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).send(`
                <script>
                    alert('Only authorized users can access');
                    window.location.href = '/login'; 
                </script>
            `);
        }
        next();
    };
};

module.exports = { authenticateJWT, authorizeRole };