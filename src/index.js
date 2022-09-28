//https://www.youtube.com/watch?v=qJ5R9WTW0_E&t=141s
//Nodejs y Mysql, Aplicación Completa (Login, Registro, CRUD, ES6+ y Más )


const express = require('express');
const morgan = require('morgan');
const {engine} = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');//explicacion en 1:55:00 del video --MUESTRA MENSAJITOS EN PANTALLA
const session =require('express-session');
const mysqlStore =require('express-mysql-session');
const passport = require('passport');

const {database} =require('./keys');

// Intializations
const app = express();
require('./lib/passport');

// Settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));

var hbs = require('handlebars');
hbs.registerHelper('eq', function (v1, v2, options) {//esto lo agrego para darle a handlebars la funcionalidad de comparar
  var res = (v1==v2)?options.fn(this):options.inverse(this);
  return res;
});
app.engine('.hbs', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars')
  }));
app.set('view engine', '.hbs');

// Middlewares
app.use(session({
secret:'nuevasession',
resave:false,
saveUninitialized:false,
store: new mysqlStore(database)
}));
app.use(flash());
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());


// Global variables

app.use((req, res, next) => {
    app.locals.message = req.flash('message');
    app.locals.success = req.flash('success');
    app.locals.user = req.user;
    next();
  });

// Routes
app.use(require('./routes'));
app.use(require('./routes/authentication'));
/* app.use('/links/edit', require('./routes/links'));
app.use('/links', require('./routes/links'));
 */
app.use('/obras', require('./routes/obras')); 
app.use('/ofertaslaborales', require('./routes/ofertaslaborales')); 
app.use('/curriculums', require('./routes/curriculums')); 



// Public
app.use(express.static(path.join(__dirname, 'public')));

//ERROR 404
app.use(function(req, res) {
  res.status(404).render('error', { esIndex: true });
 
});

// Starting
app.listen(app.get('port'), () => {
    console.log('Server is in port', app.get('port'));
  });