/*
    Main application file
    Lorenzo Cativiela Martin
*/

//Imports required
const express = require('express');


 
require('dotenv').config();

const morgan = require('morgan');
const cors = require('cors');

/* 
    Server startup code
*/
async function startServer() {

    const app = express();
    app.set('port', process.env.PORT || 4100);



    app.use(cors());
    app.use(require('morgan')('dev'));
   
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    
    router = app.use(require('./routes/base.route'));


    app.listen( app.get ( 'port' ) );
    console.log( ' Server on port', app.get('port') );
}

startServer();