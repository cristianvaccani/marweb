const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const path = require('path');

const pool = require('../database');

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

    const puestos = await GetPuestos(_puestoID);
    const provincias = await GetProvincias(_provinciaID);
    const ofertasLaborales = await GetOfertasLaborales(_ofertaLaboralID);

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

    let sqlQuery = "call filtrarCurriculums(" + _puestoID + "," + _provinciaID + "," + _ofertaLaboralID + "," + _edadDesde + "," + _edadHasta + ")";
    console.log(sqlQuery)

    pool.query(sqlQuery, function (err, recordset) {
        if (err) {
            console.log(err);

        }
        console.log(recordset);


        totalCount = recordset[0].length;
        // Instantiate Pagination class
        const Paginate = new Pagination(totalCount, currentPage, pageUri, _perPage);
        const ini = (currentPage - 1) * _perPage;
        const fin = ini + _perPage;
        var listaPostulados = recordset[0].splice(ini, fin);

        res.render('curriculums/postulados', {
            postulados: listaPostulados, puestos, provincias, ofertasLaborales, _puestoID, _provinciaID,
            _ofertaLaboralID, _ofertaLaboralID, edadDesde: _edadDesde, edadHasta: _edadHasta, pages: Paginate.links(), totalPostulados: totalCount, pageUri: pageUri
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

    const puestos = await GetPuestos(_puestoID);
    const provincias = await GetProvincias(_provinciaID);
    const ofertasLaborales = await GetOfertasLaborales(_ofertaLaboralID);

    const _perPage = registrosPorPagina;
    // Get current page from url (request parameter)
    const page_id = parseInt(req.params.page);
    const currentPage = (isNaN(page_id)) ? 1 : page_id;
    //Change pageUri to your page url without the 'page' query string 
    const pageUri = '/curriculums/';

    let sqlQuery = "call filtrarCurriculums(" + _puestoID + "," + _provinciaID + "," + _ofertaLaboralID + "," + _edadDesde + "," + _edadHasta + ")";
    console.log(sqlQuery)

    pool.query(sqlQuery, function (err, recordset) {
        if (err) {
            console.log(err);

        }
        console.log(recordset);

        totalCount = recordset[0].length;
        // Instantiate Pagination class
        const Paginate = new Pagination(totalCount, currentPage, pageUri, _perPage);
        const ini = (currentPage - 1) * _perPage;
        const fin = ini + _perPage;
        var listaPostulados = recordset[0].splice(ini, fin);

        res.render('curriculums/postulados', {
            postulados: listaPostulados, puestos, provincias, ofertasLaborales, _puestoID, _provinciaID, _ofertaLaboralID,
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
    let yaRevisado = (req.body.revisado != undefined);
    cv.revisado = yaRevisado;
    let favorito = (req.body.esFavorito != undefined);
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

    pool.query("UPDATE curriculum set activo = 0 WHERE ID =?", id);
    req.flash('success', 'Curriculum eliminado correctamente!');
    res.redirect('/curriculums');

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