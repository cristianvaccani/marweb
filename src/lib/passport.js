const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('../lib/helpers')

passport.use('local-signin', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, username, password, done) => {
      console.log(req.body);
    const rows = await pool.query('SELECT * FROM users WHERE username = ? and activo =1', [username]);
    if (rows.length > 0) {
      const user = rows[0];
      const validPassword = await helpers.comparador(password, user.password)
      if (validPassword) {
        done(null, user, req.flash('success', 'Bienvenido ' + user.username));
      } else {
        done(null, false, req.flash('message', 'Password incorrecto'));
      }
    } else {
      return done(null, false, req.flash('message', 'El Username no existe o no esta activo.'));
    }
  }));

// registra nuevo usuario y lo deja logueado
passport.use('local-signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
    const { fullname } = req.body;
    const newUser = {
        username,
        password,
        fullname
    };
    newUser.password = await helpers.encriptador(password); //encripta la contrasena para guardarla
    const result = await pool.query('INSERT INTO users SET ?', [newUser]);
    newUser.id = result.insertId;
    return done(null, newUser);
}));

/* passport.use('local-signup', async (req, username, password, done) => {
  const { fullname } = req.body;
  const newUser = {
      username,
      password,
      fullname
  };
  newUser.password = await helpers.encriptador(password); //encripta la contrasena para guardarla
  const result = await pool.query('INSERT INTO users SET ?', [newUser]);
  newUser.id = result.insertId;
  return done(null, newUser);
}); */

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const rows = await pool.query('SELECT * from users where id = ?', [id]);
    done(null, rows[0]);
});