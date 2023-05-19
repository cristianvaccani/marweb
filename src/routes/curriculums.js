const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const path = require('path');

const pool = require('../database');
const fs = require('fs');

const Pagination = require('../public/js/pagination');
const registrosPorPagina = 20;
//importo esta funcion para validar el ingreso a paginas seguras
const { isLoggedIn } = require('../lib/auth');

router.get('/:page?', isLoggedIn, async (req, res) => {

    if (!req.session.puestoID) {
        req.session.puestoID = 0;
    }
    const _puestoID = req.session.puestoID;
    if (!req.session.provinciaID) {
        req.session.provinciaID = 0;
    }
    const _provinciaID = req.session.provinciaID;
    if (!req.session.ofertaLaboralID) {
        req.session.ofertaLaboralID = 0;
    }
    const _ofertaLaboralID = req.session.ofertaLaboralID;
    if (!req.session.edadDesde) {
        req.session.edadDesde = null;
    }
    const _edadDesde = req.session.edadDesde;
    if (!req.session.edadHasta) {
        req.session.edadHasta = null;
    }
    const _edadHasta = req.session.edadHasta;
    if (!req.session.opVistoID) {
        req.session.opVistoID = 0;
    }
    const _opVistoID = req.session.opVistoID;
    if (!req.session.opFavoritoID) {
        req.session.opFavoritoID = 0;
    }
    const _opFavoritoID = req.session.opFavoritoID;

    const puestos = await GetPuestos(_puestoID);
    const provincias = await GetProvincias(_provinciaID);
    const ofertasLaborales = await GetOfertasLaborales(_ofertaLaboralID);
    const opVistos = await GetOpVistos(_opVistoID);
    const opFavoritos = await GetOpFavoritos(_opFavoritoID);

    const _perPage = registrosPorPagina;
    var page_id = req.session.currentPage;
    // Get current page from url (request parameter)
    if (req.params.page != 'undefined') {
        var page_id = parseInt(req.params.page);
    }
    //const page_id = 1;
    const currentPage = (isNaN(page_id)) ? 1 : page_id;
    req.session.currentPage = currentPage;
    //Change pageUri to your page url without the 'page' query string 
    const pageUri = '/curriculums/';

    //let sqlQuery = "call filtrarCurriculums(" + _puestoID + "," + _provinciaID + "," + _ofertaLaboralID + "," + _edadDesde + "," + _edadHasta + ")";
    let sqlQuery = "call obtenerCurriculums(" + _puestoID + "," + _provinciaID + "," + _ofertaLaboralID + "," + _edadDesde + "," + _edadHasta + "," + _opVistoID + "," + _opFavoritoID + ")";
    console.log(sqlQuery)

    pool.query(sqlQuery, function (err, recordset) {
        if (err) {
            console.log(err);

        }
        console.log(recordset);

        var datos = recordset[0].sort((a, b) => b.ID - a.ID);
        totalCount = datos.length;
        // Instantiate Pagination class
        const Paginate = new Pagination(totalCount, currentPage, pageUri, _perPage);
        const ini = (currentPage - 1) * _perPage;
        const fin = ini + _perPage;
        const listaPostulados = datos.slice(ini, fin);

        res.render('curriculums/postulados', {
            postulados: listaPostulados, puestos, provincias, ofertasLaborales,opVistos,opFavoritos, _puestoID, _provinciaID,
            _ofertaLaboralID, _opVistoID,_opFavoritoID, edadDesde: _edadDesde, edadHasta: _edadHasta, pages: Paginate.links(), totalPostulados: totalCount, pageUri: pageUri
        });

    });

});

router.post('/:page?', isLoggedIn, async (req, res) => {

    if (req.body.puestoID) {
        req.session.puestoID = req.body.puestoID;
    } else {
        req.session.puestoID = 0;
    }
    const _puestoID = req.session.puestoID;
    if (req.body.provinciaID) {
        req.session.provinciaID = req.body.provinciaID;
    } else {
        req.session.provinciaID = 0;
    }
    const _provinciaID = req.session.provinciaID;
    if (req.body.ofertaLaboralID) {
        req.session.ofertaLaboralID = req.body.ofertaLaboralID;
    } else {
        req.session.ofertaLaboralID = 0;
    }
    const _ofertaLaboralID = req.session.ofertaLaboralID;
    if (req.body.edadDesde) {
        req.session.edadDesde = req.body.edadDesde;
    } else {
        req.session.edadDesde = null;
    }
    const _edadDesde = req.session.edadDesde;
    if (req.body.edadHasta) {
        req.session.edadHasta = req.body.edadHasta;
    } else {
        req.session.edadHasta = null;
    }
    const _edadHasta = req.session.edadHasta;
    if (req.body.opVistoID) {
        req.session.opVistoID = req.body.opVistoID;
    } else {
        req.session.opVistoID = 0;
    }
    const _opVistoID = req.session.opVistoID;
    if (req.body.opFavoritoID) {
        req.session.opFavoritoID = req.body.opFavoritoID;
    } else {
        req.session.opFavoritoID = 0;
    }
    const _opFavoritoID = req.session.opFavoritoID;

    const puestos = await GetPuestos(_puestoID);
    const provincias = await GetProvincias(_provinciaID);
    const ofertasLaborales = await GetOfertasLaborales(_ofertaLaboralID);
    const opVistos = await GetOpVistos(_opVistoID);
    const opFavoritos = await GetOpFavoritos(_opFavoritoID);

    const _perPage = registrosPorPagina;
    // Get current page from url (request parameter)
    const page_id = parseInt(req.params.page);
    const currentPage = (isNaN(page_id)) ? 1 : page_id;
    //Change pageUri to your page url without the 'page' query string 
    const pageUri = '/curriculums/';

    //let sqlQuery = "call filtrarCurriculums(" + _puestoID + "," + _provinciaID + "," + _ofertaLaboralID + "," + _edadDesde + "," + _edadHasta + ")";
    let sqlQuery = "call obtenerCurriculums(" + _puestoID + "," + _provinciaID + "," + _ofertaLaboralID + "," + _edadDesde + "," + _edadHasta + "," + _opVistoID + "," + _opFavoritoID + ")";
    console.log(sqlQuery)

    pool.query(sqlQuery, function (err, recordset) {
        if (err) {
            console.log(err);

        }
        console.log(recordset);

        var datos = recordset[0].sort((a, b) => b.ID - a.ID);
        totalCount = datos.length;
        // Instantiate Pagination class
        const Paginate = new Pagination(totalCount, currentPage, pageUri, _perPage);
        const ini = (currentPage - 1) * _perPage;
        const fin = ini + _perPage;
        const listaPostulados = datos.slice(ini, fin);

        res.render('curriculums/postulados', {
            postulados: listaPostulados, puestos, provincias, ofertasLaborales,opVistos,opFavoritos, _puestoID, _provinciaID, _ofertaLaboralID,_opVistoID,_opFavoritoID, 
            edadDesde: _edadDesde, edadHasta: _edadHasta, pages: Paginate.links(), totalPostulados: totalCount, pageUri: pageUri
        });

    });

});

router.get('/view/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;

    let sqlQuery = "call getCurriculum(" + id + ")";
    console.log(sqlQuery)

    pool.query(sqlQuery, async function (err, recordset) {
        if (err) {
            console.log(err);
        }
        const cvs = recordset[0];
        if (cvs.length === 0) {
            req.flash('message', 'Curriculum no encontrado');
            res.redirect('/curriculums');
        } else {
            const puestos = await GetPuestos(cvs[0].puestoID);
            const provincias = await GetProvincias(cvs[0].provinciaID);
            const sexos = await GetSexos(cvs[0].sexoID);
            const estadosCiviles = await GetEstadosCiviles(cvs[0].estadoCivilID);

            res.render('curriculums/view', { cv: cvs[0], puestos, provincias, sexos, estadosCiviles });
        }
    });

});

router.get('/edit/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    //recupero datos desde la base
    //const cvs = await pool.query("SELECT *,date_format(fechanacimiento, '%Y-%m-%d') as fecha FROM curriculum WHERE ID=?", [id]);
    let sqlQuery = "call getCurriculum(" + id + ")";
    console.log(sqlQuery)

    pool.query(sqlQuery, async function (err, recordset) {
        if (err) {
            console.log(err);
        }
        const cvs = recordset[0];
        if (cvs.length === 0) {
            req.flash('message', 'Curriculum no encontrado');
            res.redirect('/curriculums');
        } else {
            const puestos = await GetPuestos(cvs[0].puestoID);
            const provincias = await GetProvincias(cvs[0].provinciaID);
            const sexos = await GetSexos(cvs[0].sexoID);
            const estadosCiviles = await GetEstadosCiviles(cvs[0].estadoCivilID);

            res.render('curriculums/edit', { cv: cvs[0], puestos, provincias, sexos, estadosCiviles });
        }

    });

});
router.post('/edit/:id', isLoggedIn, async (req, res) => {

    const cv = {
        ID, nombre, apellido, puestoID, detallePuesto, dni, fechaNacimiento,
        nacionalidad, domicilio, localidad, provinciaID,
        telefono, email, sexoID, estadoCivilID, trabajoActual,
        trabajoAnterior, titulos, informacionAdicional,
        trabajoEnMarelli, remuneracion, ofertaLaboralID
    } = req.body;
    cv.trabajoEnMarelli = (cv.trabajoEnMarelli != undefined)?1:0;
    let yaRevisado = (req.body.revisado != undefined)?1:0;
    cv.revisado = yaRevisado;
    let favorito = (req.body.esFavorito != undefined)?1:0;
    cv.esFavorito = favorito;
    pool.query("UPDATE curriculum set ? WHERE ID =?", [cv, cv.ID]);
    req.flash('success', 'Curriculum editado correctamente!');
    res.redirect('/curriculums');

});
router.get('/delete/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;

    let sqlQuery = "call getCurriculum(" + id + ")";
    console.log(sqlQuery)

    pool.query(sqlQuery, async function (err, recordset) {
        if (err) {
            console.log(err);
        }
        const cvs = recordset[0];
        if (cvs.length === 0) {
            req.flash('message', 'Curriculum no encontrado');
            res.redirect('/curriculums');
        } else {
            const puestos = await GetPuestos(cvs[0].puestoID);
            const provincias = await GetProvincias(cvs[0].provinciaID);
            const sexos = await GetSexos(cvs[0].sexoID);
            const estadosCiviles = await GetEstadosCiviles(cvs[0].estadoCivilID);

            res.render('curriculums/delete', { cv: cvs[0], puestos, provincias, sexos, estadosCiviles });
        }

    });

})
router.post('/delete/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    let sqlQuery = "call getCurriculum(" + id + ")";

    pool.query(sqlQuery, async function (err, recordset) {
        if (err) {
            console.log(err);
        }
        const cvs = recordset[0];
        if (cvs.length === 0) {
            req.flash('message', 'Curriculum no encontrado');
            res.redirect('/curriculums');
        } else {
            //si no hay archivo de CV solo elimino la persona con activo =0
            if (cvs[0].archivo == '-') {
                pool.query("UPDATE curriculum set activo = 0 WHERE ID =?", id);
                req.flash('success', 'Curriculum eliminado correctamente!');
                res.redirect('/curriculums');
            } else {
                //si hay archivo de CV, primero elimino fisicamente el archivo y despues elimino la persona con activo =0
                const archivo = path.join(__dirname, '..', '..', 'archivosCV', cvs[0].archivo);
                fs.stat(archivo, function (err, stats) {
                    console.log(stats);//here we got all information of file in stats variable

                    if (err) {
                        return console.error(err);
                    }

                    fs.unlink(archivo, function (err) {
                        if (err) {
                            return console.log(err);
                        } else {
                            console.log('file deleted successfully');
                            pool.query("UPDATE curriculum set activo = 0 WHERE ID =?", id);
                            req.flash('success', 'Curriculum eliminado correctamente!');
                            res.redirect('/curriculums');
                        }
                    });
                });
            }

        }

    });
})

async function GetPuestos(valor) {
    // <-- declare the function as async

    const puestos = await pool.query("SELECT * FROM cnf_puestos");
    const newPuesto = { id: 0, descripcion: "Todos" };
    puestos.unshift(newPuesto);

    const seleccionado = puestos.find(e => e.id == valor);
    seleccionado.selected = true;

    return puestos;
};

async function GetProvincias(valor) {
    const provincias = await pool.query("SELECT * FROM cnf_provincias");
    provincias.splice(0, 0, provincias.splice(19, 1)[0]);//pongo a Santa Fe primero
    const newProvincia = { id: 0, descripcion: "Todas" };
    provincias.unshift(newProvincia);

    const seleccionado = provincias.find(e => e.id == valor);
    seleccionado.selected = true;


    return provincias;
};

async function GetOfertasLaborales(valor) {
    const ofertasLaborales = await pool.query("select ol.id, ol.titulo from ofertaslaborales ol where ol.activo = true order by ol.id desc");
    const newOfertaLaboral = { id: 0, titulo: "Todos" };
    ofertasLaborales.unshift(newOfertaLaboral);

    const seleccionado = ofertasLaborales.find(e => e.id == valor);
    seleccionado.selected = true;

    return ofertasLaborales;
};

async function GetSexos(valor) {
    const sexos = await pool.query("SELECT * FROM cnf_sexos");

    const newsexo = { id: 0, descripcion: "Todos" };
    sexos.unshift(newsexo);

    const seleccionado = sexos.find(e => e.id == valor);
    seleccionado.selected = true;

    return sexos;
};

async function GetEstadosCiviles(valor) {
    const estados = await pool.query("SELECT * FROM cnf_estadosciviles");

    const newEstado = { id: 0, descripcion: "Todos" };
    estados.unshift(newEstado);

    const seleccionado = estados.find(e => e.id == valor);
    seleccionado.selected = true;

    return estados;
};

async function GetOpVistos(valor) {
    const opVistos = [];
    const newOp0 = { id: 0, descripcion: "Todos" };
    opVistos.unshift(newOp0);
    const newOp1 = { id: 1, descripcion: "Vistos" };
    opVistos.unshift(newOp1);
    const newOp2 = { id: 2, descripcion: "No Vistos" };
    opVistos.unshift(newOp2);

    const seleccionado = opVistos.find(e => e.id == valor);
    seleccionado.selected = true;

    return opVistos;
};

async function GetOpFavoritos(valor) {
    const OpFavoritos = [];
    const newOp0 = { id: 0, descripcion: "Todos" };
    OpFavoritos.unshift(newOp0);
    const newOp1 = { id: 1, descripcion: "Favoritos" };
    OpFavoritos.unshift(newOp1);
    const newOp2 = { id: 2, descripcion: "No Favoritos" };
    OpFavoritos.unshift(newOp2);

    const seleccionado = OpFavoritos.find(e => e.id == valor);
    seleccionado.selected = true;

    return OpFavoritos;
};

router.get('/edit/download/:id', isLoggedIn, async (req, res) => {
    download(req, res);
});

router.get('/view/download/:id', isLoggedIn, async (req, res) => {
    download(req, res);
});

function download(req, res) {
    const archivo = path.join(__dirname, '..', '..', 'archivosCV', req.params.id);

    res.download(archivo, req.params.id, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("donwload OK!");
        }
    });
}

module.exports = router; 