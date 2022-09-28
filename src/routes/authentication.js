const express = require('express');
const { ResultWithContext } = require('express-validator/src/chain');
const router = express.Router();
const passport=require('passport');

//importo esta funcion para validar el ingreso a paginas seguras
//isLoggedIn: valida el ingreso a paginas que requieren estar logueado
//isNotLoggedIn: evita mostrar paginas que no quiero que vea cuando ya esta logueado
const {isLoggedIn,isNotLoggedIn} = require('../lib/auth');

// SIGNUP
/*ruta para mostrar el formulario*/
router.get('/signup',isNotLoggedIn,(req,res)=>{
    res.render('auth/signup')
});

router.post('/signup', passport.authenticate('local-signup',{
        successRedirect:'/success',
        failureRedirect:'/signup',
        failureFlash:true
}));
// registracion exitaosa
router.get('/success',(req,res)=>{
    req.logOut();
    res.render('auth/success')
}); 

// SINGIN
router.get('/signin',isNotLoggedIn,(req,res)=>{
    res.render('auth/signin')
}); 

 
// SINGIN
router.get('/signin',isNotLoggedIn,(req,res)=>{
    res.render('auth/signin')
}); 

router.post('/signin', (req,res,next)=>{
    
    passport.authenticate('local-signin',{
        successRedirect:'/profile',
        failureRedirect:'/signin',
        failureFlash:true
    })(req, res, next);
});

//con isLoggedIn valido el ingreso de paginas seguras que el usuario tiene que estar logueado
router.get('/profile',isLoggedIn,(req,res)=>{

    res.render('profile',{esProfile:true});
});

router.get('/logout',(req,res)=>{
    req.logOut(); //cierra la session del usuario
    res.redirect('/signin');
});


module.exports = router;