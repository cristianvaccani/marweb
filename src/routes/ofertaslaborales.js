const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const pool = require('../database');

//importo esta funcion para validar el ingreso a paginas seguras
const { isLoggedIn } = require('../lib/auth');

router.get('/', isLoggedIn, async (req, res) => {
    //recupero datos desde la base
    /* const jobs = await pool.query("SELECT *,date_format(fecha, '%d/%m/%Y') as fecha FROM ofertaslaborales WHERE activo=1");  */
    const jobs = await pool.query("SELECT *,date_format(fecha, '%d/%m/%Y') as fecha,if(activo=false,null,true) as ofertaActiva FROM ofertaslaborales order by activo desc, fecha DESC");
    const cantActivas= jobs.filter(o=>o.ofertaActiva==true);

    console.log(jobs);
    res.render('ofertaslaborales/list', { jobs,cantActivas });//con esta linea mando el objeto links (entre llaves) a la vista

});

router.get('/add', isLoggedIn, (req, res) => {
    res.render('ofertaslaborales/add');
});


router.post('/add',
    [
        body('titulo', 'Ingrese un título')
            .exists()
            .notEmpty(),
        body('descripcion', 'Ingrese una descripción')
            .exists()
            .notEmpty(),
        body('fecha', 'Ingrese una fecha')
            .exists()
            .notEmpty()
        /* .custom((value, { req }) => {
            var vregexNaix = /^(0[1-9]|[1-2]\d|3[01])(\/)(0[1-9]|1[012])\2(\d{4})$/;
            vregexNaix.test(value);
            if (!vregexNaix.test(value)) {
              throw new Error('ingrese una fecha válida');
            }
            // Indicates the success of this synchronous custom validator
            return true;
          }) */
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const valores = req.body;
            const validaciones = errors.array();
            res.render('ofertaslaborales/add', { validaciones: validaciones, valores: valores });
        }
        else {
            const { titulo, descripcion, fecha, imagen, activo } = req.body; //es se llama destructuring incluido en las ultimas versiones de javascript. Permite obtener propiedades de un objeto.
            const valor_activo = (activo != undefined);
            const newJob = {
                titulo,
                descripcion,
                fecha,
                imagen,
                activo: valor_activo
            };
            //insert en la base de datos. el await tiene que llevar siempre un async al inicio de la funcion.
            /* await pool.query("INSERT INTO ofertaslaborales (titulo,descripcion,fecha, activo) VALUES (?,?,STR_TO_DATE(?, '%d/%m/%Y'),?)", [titulo, descripcion, fecha, true]);  */
            await pool.query("INSERT INTO ofertaslaborales SET ?", [newJob]);
            req.flash('success', 'Oferta laboral guardada correctamente!');
            res.redirect('/ofertaslaborales');
        }
    });


router.get('/delete/:id', isLoggedIn, async (req, res) => {
    const id = req.params.id;
    const links = await pool.query('SELECT * FROM ofertaslaborales WHERE id=?', [id]);
    if (links.length === 0) {
        req.flash('message', 'Oferta laboral NO encontrada');
        res.redirect('/ofertaslaborales');
    } else {
        await pool.query('DELETE FROM ofertaslaborales where id=?', id); //recupero datos desde la base
        req.flash('success', 'Oferta laboral eliminada correctamente!');
        res.redirect('/ofertaslaborales');//con esta linea mando el objeto links (entre llaves) a la vista
    }
});

router.get('/edit/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    //recupero datos desde la base
    const jobs = await pool.query("SELECT *,date_format(fecha, '%Y-%m-%d') as fecha FROM ofertaslaborales WHERE id=?", [id]);

    if (jobs.length === 0) {
        req.flash('message', 'Oferta laboral NO encontrada');
        res.redirect('/ofertaslaborales');
    } else {
        res.render('ofertaslaborales/edit', { job: jobs[0] });//con esta linea mando el objeto links (entre llaves) a la vista
    }
})
router.post('/edit/:id',
    [
        body('titulo', 'Ingrese un título')
            .exists()
            .notEmpty(),
        body('descripcion', 'Ingrese una descripción')
            .exists()
            .notEmpty(),
        body('fecha', 'Ingrese una fecha')
            .exists()
            .notEmpty()
    ]
    , async (req, res) => {
        const { id } = req.params; //a traves de req.body recibo los datos desde los campos name del html 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const valores = req.body;
            const validaciones = errors.array();
            res.render('ofertaslaborales/edit', { validaciones: validaciones, job: valores });
        }
        else {
            const { titulo, descripcion, fecha, imagen, activo } = req.body; //es se llama destructuring incluido en las ultimas versiones de javascript. Permite obtener propiedades de un objeto.
            const valor_activo = (activo != undefined);
            const newJob = {
                titulo,
                descripcion,
                fecha,
                imagen,
                activo: valor_activo
            };
            await pool.query("UPDATE ofertaslaborales set ? WHERE id =?", [newJob, id]); //insert en la base de datos. el await tiene que llevar siempre un async al inicio de la funcion.
            req.flash('success', 'Oferta laboral editado correctamente!');
            res.redirect('/ofertaslaborales');
        }
    });


module.exports = router; 