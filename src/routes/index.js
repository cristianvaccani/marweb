const express = require('express');
const transporter = require('./../config/mailer');
const router = express.Router();
const pool = require('../database');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: 'archivosCV/',
    filename: function (req, file, cb) {
        const partesNombre = file.originalname.split('.'); 
        cb("", partesNombre[0] + "_" +Date.now()+'.'+partesNombre[1]);
        /* cb("", file.originalname + "_" +Date.now()); */
    }

});
const archivosCV = multer({
    storage: storage,
    limits: {
        fieldNameSize: 250,
        fileSize: 1048576, // 10 Mb
    },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('archivoCV');

function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /pdf|doc|docx|txt|text/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(null, false);
        /* cb(new Error('Tipo de archivo no valido')); */
    }
}

const esIndex = true;

/* router.get('/', async (req, res) => {
    console.log('ENTRO AL INDEX#######################################');
    const works = await pool.query("SELECT o.*,t.descripcion as tipoObra,(select f.nombre FROM obrasfotos f WHERE f.obraID =o.id order by esPrincipal desc limit 1) as foto from obras o INNER JOIN cnf_tiposobras t on t.id = o.tipoObraID where o.activo =true order by anio desc;");
    console.log(works);
    const tipos = await pool.query("SELECT * FROM cnf_tiposObras");
    
    

    res.render('index', { esIndex: true, works,tipos });
    
}); */

router.get('/', async (req, res) => {

    const works = await getAllWorks();
    console.log('Cantidad de works:',works.length);
    
    const tipos = await getAllTipos();
    console.log('Cantidad de tipos:',tipos.length);

    res.render('index', { esIndex: true, works,tipos });
});

function getAllWorks(){
    console.log('entro en getAllWorks');
    return new Promise((res,rej)=>{
        const works = pool.query("SELECT o.*,t.descripcion as tipoObra,(select f.nombre FROM obrasfotos f WHERE f.obraID =o.id order by esPrincipal desc limit 1) as foto from obras o INNER JOIN cnf_tiposobras t on t.id = o.tipoObraID where o.activo =true order by anio desc;");
        if(works.length ===0){
            rej(new Error('No hay obras.'))
        }
        res(works);
    });

}
function getAllTipos(){
    console.log('entro en getAllTipos');
    return new Promise((res,rej)=>{
        const tipos = pool.query("SELECT * FROM cnf_tiposobras;");
        if(tipos.length ===0){
            rej(new Error('No hay tipos.'))
        }
        res(tipos);
    });

}

router.get('/contact', async (req, res) => {
    res.render('contact', { esIndex: true });
});

router.post('/sendmail', async (req, res) => {
    const { name, email, subject, message } = req.body;
    contentHTML = `
<h1>User informacion</h1>
<ul>
    <li>username: ${name}</li>
    <li>mail: ${email}</li>
    <li>subject: ${subject}</li>
    <p>message: ${message}</p>
</ul>
`;
    const info = await transporter.sendMail({
        from: "'Marelli web' <3416173320.marelli@gmail.com>",
        to: '3416173320.marelli@gmail.com',
        subject: 'Contacto desde la web',
        html: contentHTML
    });

    console.log('mensaje enviado', info.messageId);
    req.flash('success', 'Email enviado correctamente!');
    res.redirect('/contact');
});

router.get('/about', async (req, res) => {
    res.render('about', { esIndex: true });
});

router.get('/polity', async (req, res) => {
    res.render('polity', { esIndex: true });
});

router.get('/services', async (req, res) => {
    res.render('services', { esIndex: true });
});

router.get('/jobs', async (req, res) => {
    var jobs = await pool.query("SELECT *,date_format(fecha, '%d/%m/%Y') as fecha FROM ofertaslaborales where activo=true;");
    jobs = jobs.sort(function(a,b){
        var aa = a.fecha.split('/').reverse().join(),
        bb = b.fecha.split('/').reverse().join();
        return aa < bb ? 1 : (aa > bb ? -1 : 0);
      });
    jobs.forEach(job => {
        if (job.descripcion.length > 249) {
            job.descripcion = job.descripcion.substring(0, 250) + "...";
        }
    });
    
    res.render('jobs', { esIndex: true, jobs });
});

router.get('/job/:id', async (req, res) => {
    const id = req.params.id;
    const jobs = await pool.query("SELECT *,date_format(fecha, '%d/%m/%Y') as fecha FROM ofertaslaborales where id=?", [id]);
    if (jobs.length === 0) {
        res.redirect('/error');
    } else {
        const allJobs = await pool.query("SELECT *,date_format(fecha, '%d/%m/%Y') as fecha FROM ofertaslaborales where activo=true");
        res.render('job', { esIndex: true, job: jobs[0], allJobs });
    }
});

router.get('/error', async (req, res) => {
    res.render('error', { esIndex: true });
});

router.get('/works', async (req, res) => {
    const works = await pool.query("SELECT o.*,t.descripcion as tipoObra,(select f.nombre FROM obrasfotos f WHERE f.obraID =o.id order by esPrincipal desc limit 1) as foto from obras o INNER JOIN cnf_tiposobras t on t.id = o.tipoObraID where o.activo =true order by anio desc;");
    const tipos = await pool.query("SELECT * FROM cnf_tiposobras");
    
    res.render('works', { esIndex: true, works,tipos });
});

router.get('/work/:id', async (req, res) => {
    const id = req.params.id;
    const works = await pool.query("SELECT o.*,t.descripcion as tipoObra, GROUP_CONCAT(f.nombre) AS fotos FROM obras o inner join cnf_tiposobras t on t.id = o.tipoObraID left JOIN obrasfotos f on o.id = f.obraID where o.id=? GROUP BY o.id;", [id]);
    if (works.length === 0) {
        res.redirect('/error');
    } else {
        works[0].listaFotos = works[0].fotos.split(',');
        res.render('work', { esIndex: true, work: works[0]});
    }
});

router.get('/curriculum/:id?', async (req, res) => {

    let ofertaLaboralID = req.params.id;
    let tituloOfertaLaboral = "";
    if (ofertaLaboralID) {
        const ofertaLaboral = await pool.query("SELECT * FROM ofertaslaborales where activo =true && id=?", ofertaLaboralID);
        if (ofertaLaboral.length > 0) {
            ofertaLaboralID = ofertaLaboral[0].id;
            tituloOfertaLaboral = ofertaLaboral[0].titulo;
        }
    }
    const provincias = await pool.query("SELECT * FROM cnf_provincias");
    
    provincias.splice(0, 0, provincias.splice(19, 1)[0]);
    const sexos = await pool.query("SELECT * FROM cnf_sexos order by descripcion desc");
    const estadosCiviles = await pool.query("SELECT * FROM cnf_estadosciviles");
    const puestos = await pool.query("SELECT * FROM cnf_puestos");
    res.render('curriculum', { esIndex: true, provincias, sexos, estadosCiviles, puestos, ofertaLaboralID, tituloOfertaLaboral });
});

router.post('/curriculum',  /* archivosCV.single('archivoCV'),  */ async (req, res) => {


    //    cv[0].trabajoEnMarelli = trabajoEnMarelli;

    // valido la subida del archivo
    archivosCV(req, res, (err) => {
        console.log('Entered profile upload.');
        if (err) {
            req.flash('message', 'Ha ocurrido un error. ' + err.message);
            res.redirect('/curriculum');
        } else {

            //recupero los datos

            const cv = {
                nombre, apellido, puestoID, detallePuesto, dni, fechaNacimiento,
                nacionalidad, domicilio, localidad, provinciaID,
                telefono, email, sexoID, estadoCivilID, trabajoActual,
                trabajoAnterior, titulos, informacionAdicional,
                trabajoEnMarelli, remuneracion, ofertaLaboralID
            } = req.body;
            if(!Number.isInteger(cv.remuneracion)) {
                cv.remuneracion = 0;
            }
            let yaTrabajoEnMarelli = (req.body.trabajoEnMarelli != undefined);
            cv.trabajoEnMarelli = yaTrabajoEnMarelli;
            cv.fechaSubido = new Date;
            cv.activo = true;
            /* Begin transaction */
            inTransaction(pool, function (db, next) {
                db.query("INSERT INTO curriculum SET ?", [cv], function (err, cb) {
                    if (err) return next(err);
                    if (req.file) {
                        const file = {
                            curriculumID: cb.insertId,
                            nombreArchivo: req.file.filename
                        }
                        db.query("INSERT INTO curriculumarchivo SET ?", [file], function (err) {
                            return next(err);
                        });
                    } else {
                        next();
                    }

                });
            }, function (err) {

                console.log("All done, transaction ended and connection released");
                req.flash('success', 'Curriculum subido correctamente!');
                res.redirect('/curriculum');
            });

            /* End transaction */




        }



    });
});

function inTransaction(pool, body, callback) {
    withConnection(pool, function (db, done) {

        db.beginTransaction(function (err) {
            if (err) return done(err);

            body(db, finished)
        })

        // Commit or rollback transaction, then proxy callback
        function finished(err) {
            var context = this;
            var args = arguments;

            if (err) {
                if (err == 'rollback') {
                    args[0] = err = null;
                }
                db.rollback(function () { done.apply(context, args) });
            } else {
                db.commit(function (err) {
                    args[0] = err;
                    done.apply(context, args)
                })
            }
        }
    }, callback)
}

function withConnection(pool, body, callback) {
    pool.getConnection(function (err, db) {
        if (err) return callback(err);

        body(db, finished);

        function finished() {
            db.release();
            callback.apply(this, arguments);
        }
    })
};
module.exports = router;