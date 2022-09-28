const bcryptjs = require('bcryptjs');
const bcrypt = require('bcryptjs/dist/bcrypt');
const helpers={};

//esta funcion recibe el password como texto plano 
//y devuelte en hash el password sifrado
helpers.encriptador= async (password)=>{
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcrypt.hash(password,salt);
    return hash;
}

helpers.comparador = async(password,savePassword)=>{
   try{
       return await bcrypt.compare(password,savePassword);
   }
    catch{
        console.log(e);
    }
}

module.exports = helpers;