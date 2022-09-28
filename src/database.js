const mysql =require('mysql');
const {promisify} = require('util');
const Connection = require('mysql/lib/Connection');

const { database} = require('./keys');

const pool = mysql.createPool(database);

pool.getConnection((err,connection)=>{
    if(err){
        if(err.code ==='PROTOCOL_CONNECTION_LOST'){
            console.log('DATABASE CONNECTION PERDIDA');
        }
        if(err.code === 'ER_CON_COUNT_ERROR'){
            console.log('DATABASE CONNECTION MUCHAS CONEXIONES');
        }
        if(err.code === 'ECONNREFUSED'){
            console.log('DATABASE CONNECTION RECHAZADA');
        }
    }
    //si no hay errores de conexion, empiezo la conexion con realice()
    if(connection) connection.release();
    console.log('DB conectada');
    return;
});

pool.query = promisify(pool.query);
module.exports = pool;