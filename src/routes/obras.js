const express = require('express');
const router = express.Router();

const pool = require('../database');

const path = require('path');
const multer = require('multer');

//importo esta funcion para validar el ingreso a paginas seguras
const { isLoggedIn } = require('../lib/auth');

router.get('/list', isLoggedIn, async (req, res) => {
    let sqlQuery = "call getObras()";
    console.log(sqlQuery)

    const aaa = await pool.query(sqlQuery, function (err, recordset) {
        if (err) {
            console.log(err);

        }
        console.log(recordset);
        const cantActivas = recordset[0].filter(o => o.obraActiva == true);
        recordset[0].forEach(function (i) {
            if (i.fotos == null) {
                i.listaFotos = [];
            } else {
                i.listaFotos = i.fotos.split(',');
            }

        });
        res.render('obras/list', { obras: recordset[0], cantActivas });



    });


});

router.get('/add', isLoggedIn, async (req, res) => {
    const tipos = await GetTiposObras(1);
    res.render('obras/add', { tipos });
});

router.post('/add', isLoggedIn, async (req, res) => {
    obraFotos(req, res, (err) => {
        console.log('Entered profile upload.');
        if (err) {
            req.flash('message', 'Ha ocurrido un error. ' + err.message);
            res.redirect('/obras/list');
        } else {
            const { titulo, descripcion, nombre, cliente, ubicacion, tipoObraID, anio, activo } = req.body;
            const obra = { titulo, descripcion, nombre, cliente, ubicacion, tipoObraID, anio, activo };

            const valor_activo = (activo != undefined);
            obra.activo = valor_activo;

            /* Begin transaction */
            inTransaction(pool, function (db, next) {
                db.query("INSERT INTO obras SET ?", [obra], function (err, cb) {
                    if (err) return next(err);
                    if (req.files.length > 0) {
                        var banderaPrincipal = true;
                        req.files.forEach(function (item, i) {
                            const file = {
                                obraID: cb.insertId,
                                nombre: item.filename,
                                esPrincipal: banderaPrincipal
                            }
                            banderaPrincipal = false;
                            db.query("INSERT INTO obrasfotos SET ?", [file], function (err) {

                            });
                        });
                        return next(err);

                    } else {
                        next();
                    }

                });
            }, function (err) {

                console.log("All done, transaction ended and connection released");
                req.flash('success', 'Obra guardada correctamente!');
                res.redirect('/obras/list');
            });

            /* End transaction */

        }
    });

});

router.get('/edit/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    //recupero datos desde la base
    const obras = await pool.query("SELECT * FROM obras WHERE id=?", [id]);
    const tipos = await GetTiposObras(obras[0].tipoObraID);

    if (obras.length === 0) {
        req.flash('message', 'Obra NO encontrada');
        res.redirect('/obras');
    } else {
        const tipos = await GetTiposObras(obras[0].tipoObraID);
        res.render('obras/edit', { obra: obras[0], tipos });
    }
})

router.post('/edit/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, nombre, cliente, ubicacion, tipoObraID, anio, activo } = req.body;
    const obra = { titulo, descripcion, nombre, cliente, ubicacion, tipoObraID, anio, activo };

    const valor_activo = (activo != undefined);
    obra.activo = valor_activo;
    await pool.query("UPDATE obras set ? WHERE id =?", [obra, id]);
    req.flash('success', 'Obra editada correctamente!');
    res.redirect('/obras/list');

});

router.get('/addFotos/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;

    const obras = await pool.query("SELECT * FROM obras WHERE id=?", [id]);
    res.render('obras/addFotos', { obra: obras[0] });
});

router.post('/addFotos/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    obraFotos(req, res, (err) => {
        console.log('Entered profile upload.');
        if (err) {
            req.flash('message', 'Ha ocurrido un error. ' + err.message);
            res.redirect('/obras/list');
        } else {

            /* Begin transaction */
            inTransaction(pool, function (db, next) {

                req.files.forEach(function (item, i) {
                    const file = {
                        obraID: id,
                        nombre: item.filename.replaceAll(' ', '')
                    }
                    db.query("INSERT INTO obrasfotos SET ?", [file], function (err) {

                    });
                });
                return next(err);


            }, function (err) {

                console.log("All done, transaction ended and connection released");
                req.flash('success', 'Obra guardada correctamente!');
                res.redirect('/obras/list');
            });

            /* End transaction */

        }
    });

});

router.get('/deleteFoto/:parametros', isLoggedIn, async (req, res) => {
    const parametros = req.url.split('/')[2].split('?');
    const id = parametros[0];
    const nombre = parametros[1].replaceAll('%', ' ');
    const fotos = await pool.query('SELECT * FROM obrasfotos WHERE obraID=? and nombre=?', [id, nombre]);
    if (fotos.length === 0) {
        req.flash('message', 'Foto NO encontrada');
        res.redirect('/obras/list');
    } else {


        pool.query("DELETE FROM obrasfotos WHERE obraID=? and nombre=?", [id, nombre]);

        console.log("All done, transaction ended and connection released");
        req.flash('success', 'Foto eliminada correctamente!');
        res.redirect('/obras/list');

    }
});

router.get('/setFavourite/:parametros', isLoggedIn, async (req, res) => {
    const parametros = req.url.split('/')[2].split('?');
    const id = parametros[0];
    const nombre = parametros[1].replaceAll('%', ' ');
    
    /* Begin transaction */
    inTransaction(pool, function (db, next) {
        db.query('Update obrasfotos set esPrincipal =false WHERE obraID=? ', [id], function (err, cb) {
            if (err) return next(err);

            db.query('Update obrasfotos set esPrincipal =true WHERE obraID=? and nombre =?', [id, nombre], function (err) {
            });
            next();
        });
    }, function (err) {
        if(err){
            req.flash('message', 'Foto NO encontrada');            
        }else{
            req.flash('success', 'Foto Principal actualizada');
        }
        console.log("All done, transaction ended and connection released");
        res.redirect('/obras/list');
    });

    /* End transaction */

});

router.get('/delete/:id', isLoggedIn, async (req, res) => {
    const id = req.params.id;
    const links = await pool.query('SELECT * FROM obras WHERE id=?', [id]);
    if (links.length === 0) {
        req.flash('message', 'Obra NO encontrada');
        res.redirect('/obras');
    } else {

        /* Begin transaction */
        inTransaction(pool, function (db, next) {
            db.query("DELETE FROM obrasfotos where obraID=?", id, function (err, cb) {
                if (err) return next(err);

                db.query("DELETE FROM obras where id=?", id, function (err) { });

                return next(err);


            });
        }, function (err) {

            console.log("All done, transaction ended and connection released");
            req.flash('success', 'Obra eliminada correctamente!');
            res.redirect('/obras/list');
        });

        /* End transaction */


    }
});

async function GetTiposObras(valor) {
    const tipos = await pool.query("SELECT * FROM cnf_tiposobras");

    return tipos;
};

const storage = multer.diskStorage({
    destination: 'src/public/fotosObras/',
    filename: function (req, file, cb) {
        cb("", Date.now() + file.originalname.replaceAll(' ', ''));
    }

});

const obraFotos = multer({
    storage: storage,
    limits: {
        fieldNameSize: 250,
        fileSize: 1048576, // 10 Mb
    },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).array('fotos');

function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpg|jpeg|png/;
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
};

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
};

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
