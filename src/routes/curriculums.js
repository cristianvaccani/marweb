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

// Función auxiliar para obtener los valores de los filtros
function getFilterValues(req) {
    // Si la sesión no tiene puestoID, o no es un array, se inicializa como un array con el valor 0
    let _puestoID = req.session.puestoID || [0];
    if (!Array.isArray(_puestoID)) {
        _puestoID = [_puestoID];
    }
    // Si '0' (Todos) está presente, se elimina cualquier otro ID.
    if (_puestoID.includes('0')) {
        _puestoID = ['0'];
    }
    const puestosIDsStr = _puestoID.length > 0 ? _puestoID.join(',') : '0';

    const _provinciaID = req.session.provinciaID || 0;
   
    let _localidadID = req.session.localidadID || ["Todas"];
    if (!Array.isArray(_localidadID)) {
        _localidadID = [_localidadID];
    }
    // Si 'Todas' está presente, se elimina cualquier otra localidad.
    if (_localidadID.includes('Todas')) {
        _localidadID = ["Todas"];
    }
    const localidadesParaSQL = _localidadID.length > 0 ? _localidadID.join(',') : 'Todas';

    const _sexoID = req.session.sexoID || 0;
    const _ofertaLaboralID = req.session.ofertaLaboralID || 0;
    const _edadDesde = req.session.edadDesde || null;
    const _edadHasta = req.session.edadHasta || null;
    const _opVistoID = req.session.opVistoID || 0;
    const _opFavoritoID = req.session.opFavoritoID || 0;

    return {
        _puestoID, _provinciaID, _localidadID, _sexoID, _ofertaLaboralID,
        _edadDesde, _edadHasta, _opVistoID, _opFavoritoID,
        puestosIDsStr, localidadesParaSQL
    };
}

router.get('/:page?', isLoggedIn, async (req, res) => {

    // Inicializa los valores de la sesión si no existen
    if (!req.session.puestoID) req.session.puestoID = [0];
    if (!req.session.provinciaID) req.session.provinciaID = 0;
    if (!req.session.localidadID) req.session.localidadID = ["Todas"];
    if (!req.session.sexoID) req.session.sexoID = 0;
    if (!req.session.ofertaLaboralID) req.session.ofertaLaboralID = 0;
    if (!req.session.edadDesde) req.session.edadDesde = null;
    if (!req.session.edadHasta) req.session.edadHasta = null;
    if (!req.session.opVistoID) req.session.opVistoID = 0;
    if (!req.session.opFavoritoID) req.session.opFavoritoID = 0;

    const filtros = getFilterValues(req);

    const puestos = await GetPuestos(filtros._puestoID);
    const provincias = await GetProvincias(filtros._provinciaID);
    const localidades = await GetLocalidades(filtros._localidadID);
    const sexos = await GetSexos(filtros._sexoID);
    const ofertasLaborales = await GetOfertasLaborales(filtros._ofertaLaboralID);
    const opVistos = await GetOpVistos(filtros._opVistoID);
    const opFavoritos = await GetOpFavoritos(filtros._opFavoritoID);

    const _perPage = registrosPorPagina;
    const currentPage = parseInt(req.params.page) || req.session.currentPage || 1;
    req.session.currentPage = currentPage;
    const pageUri = '/curriculums/';

    // Usa el placeholder '?' y pasa los valores como un array
    const sqlQuery = "call obtenerCurriculums(?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const params = [
        filtros.puestosIDsStr, filtros._provinciaID, filtros._ofertaLaboralID, 
        filtros._edadDesde, filtros._edadHasta, filtros._opVistoID, 
        filtros._opFavoritoID, filtros.localidadesParaSQL, filtros._sexoID
    ];

    pool.query(sqlQuery,params, function (err, recordset) {
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
            postulados: listaPostulados, puestos, provincias, localidades,sexos, ofertasLaborales, opVistos, opFavoritos, /* _puestoID, _provinciaID,
            _ofertaLaboralID, _opVistoID, _opFavoritoID, */ edadDesde: filtros._edadDesde, edadHasta: filtros._edadHasta, pages: Paginate.links(), totalPostulados: totalCount, pageUri: pageUri
        });

    });

});

router.post('/:page?', isLoggedIn, async (req, res) => {

    // Actualiza los valores de la sesión
    req.session.puestoID = req.body.puestoID || [0];
    req.session.provinciaID = req.body.provinciaID || 0;
    req.session.localidadID = req.body.localidadID || ["Todas"];
    req.session.sexoID = req.body.sexoID || 0;
    req.session.ofertaLaboralID = req.body.ofertaLaboralID || 0;
    req.session.edadDesde = req.body.edadDesde || null;
    req.session.edadHasta = req.body.edadHasta || null;
    req.session.opVistoID = req.body.opVistoID || 0;
    req.session.opFavoritoID = req.body.opFavoritoID || 0;

    const filtros = getFilterValues(req);

    const puestos = await GetPuestos(filtros._puestoID);
    const provincias = await GetProvincias(filtros._provinciaID);
    const localidades = await GetLocalidades(filtros._localidadID);
    const sexos = await GetSexos(filtros._sexoID);
    const ofertasLaborales = await GetOfertasLaborales(filtros._ofertaLaboralID);
    const opVistos = await GetOpVistos(filtros._opVistoID);
    const opFavoritos = await GetOpFavoritos(filtros._opFavoritoID);

    const _perPage = registrosPorPagina;
    const currentPage = parseInt(req.params.page) || req.session.currentPage || 1;
    const pageUri = '/curriculums/';

    // Usa el placeholder '?' y pasa los valores como un array
    const sqlQuery = "call obtenerCurriculums(?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const params = [
        filtros.puestosIDsStr, filtros._provinciaID, filtros._ofertaLaboralID, 
        filtros._edadDesde, filtros._edadHasta, filtros._opVistoID, 
        filtros._opFavoritoID, filtros.localidadesParaSQL, filtros._sexoID
    ];

    pool.query(sqlQuery, params, function (err, recordset) {
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
            postulados: listaPostulados, puestos, provincias, localidades, sexos, ofertasLaborales, opVistos, opFavoritos, /* _puestoID, _provinciaID, _ofertaLaboralID, _opVistoID, _opFavoritoID, */
            edadDesde: filtros._edadDesde, edadHasta: filtros._edadHasta, pages: Paginate.links(), totalPostulados: totalCount, pageUri: pageUri
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
    cv.trabajoEnMarelli = (cv.trabajoEnMarelli != undefined) ? 1 : 0;
    let yaRevisado = (req.body.revisado != undefined) ? 1 : 0;
    cv.revisado = yaRevisado;
    let favorito = (req.body.esFavorito != undefined) ? 1 : 0;
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

async function GetPuestos(valores) {
    // <-- declare the function as async

    const puestos = await pool.query("SELECT * FROM cnf_puestos");
    const newPuesto = { id: 0, descripcion: "Todos" };
    puestos.unshift(newPuesto);

    // Si 'valores' es un string, lo convertimos en un array
    const selectedValues = Array.isArray(valores) ? valores : [valores];
    
    // Marcamos como seleccionados todos los IDs que se encuentren en el array 'selectedValues'
    puestos.forEach(puesto => {
        if (selectedValues.includes(puesto.id.toString())) {
            puesto.selected = true;
        }
    });

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

async function GetLocalidades(valores) {
    const localidades = await pool.query("select DISTINCT c.localidad from curriculum c order by c.localidad;");

    const newlocalidad = { localidad: "Todas" };
    localidades.unshift(newlocalidad);

    // Si 'valores' es un string, lo convertimos en un array
    const selectedValues = Array.isArray(valores) ? valores.map(v => v.toString()) : [valores.toString()];

    // Marcamos como seleccionados todos los IDs que se encuentren en el array 'selectedValues'
    localidades.forEach(localidad => {
        if (selectedValues.includes(localidad.localidad)) {
            localidad.selected = true;
        }
    });


    return localidades;
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