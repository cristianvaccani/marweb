//para validar un ingres seguro a paginas que requieren autenticacion
module.exports = {
    isLoggedIn (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        };
        
        return res.redirect('/signin');
    },

    isNotLoggedIn (req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        };
        
        return res.redirect('/profile');
    }
};