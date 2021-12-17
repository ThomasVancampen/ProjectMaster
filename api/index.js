const express = require('express');
const AWS = require('aws-sdk');
const axios = require('axios');
const {v4} = require("uuid");
const cors = require('cors');
const path = require('path');
const mysql = require('mysql');

const app = express();

app.use(express.json());

app.get('/hello', (req, res) => {
    res.json('Hello world!');
});

app.post('/exchange-code', (req, res)=>{
    const {code} = req.body;
    const grant_type = 'authorization_code';
    const client_id = '7udffkrr5d550gfkere3fhl8bi';
    const redirect_uri = 'https://ec2-34-231-180-93.compute-1.amazonaws.com:3000/front/callback.html';
    const client_secret = 'bo8igterhbm1aiibv5ph53lta816t4n3qlbduhgqtfgs6a8bb6o';

    const params = new URLSearchParams({grant_type}, client_id, redirect_uri, code);



    axios.post(' https://gif-converter-g2.auth.us-east-1.amazoncognito.com/oauth2/token',
    params.toString(),
    {
        auth: {
            username: client_id,
            password: client_secret,
        }
    }
    ).then(result => {
        console.log('result data', result.data);
        res.cookie('id_token', result.data.id_token, {httpOnly :true})
        res.json(result.data);
    }).catch(err => {
        console.error(err);
        res.status(500).json(err);
    })
})

const s3 = new AWS.S3({
    region: 'us-east-1',
})

const bucketName = 'gif-2-bucket';
app.use(express.json());
app.get('/', (req, res) => {
 res.sendFile(path.join(__dirname, '../front/index.html'));
});
app.get('/front/callback.html', (req, res) => {
res.sendFile(path.join(__dirname, '../front/callback.html'));
});
app.get('/front/script.js', (req, res) => {
res.sendFile(path.join(__dirname, '../front/script.js'));
});


const con = mysql.createConnection({
    host: 'gif-project-db.cavxmh9v9svl.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'IctGroep2',
    database: 'gif_db'
});

let oIds = [];
let i = 0;

app.use(cors());

app.get('/getuploadurl', async (req,res)=>{
    await s3.createPresignedPost({
        Fields:{
            key: v4(),
        },
        Conditions: [
            ["starts-with", "$Content-Type", "image/"],
            ["content-length-range", 0, 1000000],
            ],
            Expires: 900,
            Bucket: bucketName,
    }, (err, signed) => {
    res.json(signed);
    
    console.log(signed.fields.key);
    oIds[i] = signed.fields.key;
    i++;

    
    
    
  });
});

app.post('/signaluploadcompleted',(req,res)=>{
const inputImageUrls = oIds.map(objectId => generateGetUrl(objectId));
i=0;
oIds = [];

const outputObjectId = v4();
console.log('Output object id: ',outputObjectId);
const outputImageUrl = generatePutUrl(outputObjectId, 'image/gif');

axios.post('https://msw31oj97f.execute-api.eu-west-1.amazonaws.com/Prod/generate/gif', {inputImageUrls,outputImageUrl},
{headers:{
    'x-api-key': 'SIdHi3lzwma61h4GeBGR96ZD4rpsa3mb6iKVlMG7 '
    }
})
.then(function (response) {
res.send(outputObjectId);
})
.catch(function (error) {
res.status(500).json(error);
});
});

app.listen(3000, () => {
    console.log('Started api on http://ec2-44-200-41-166.compute-1.amazonaws.com:3000')
})

function extractObjectId(url){
    const urlWithoutParams = url.split('?')[0];
    const splitUrlInSlashes = urlWithoutParams.split('/')
    return splitUrlInSlashes[splitUrlInSlashes.length - 1];
    }
    
    function generateGetUrl(objectId){
    return s3.getSignedUrl("getObject",{
    Key: objectId,
    Bucket: bucketName,
    Expires: 900,
    });
    }
    
    function generatePutUrl(objectId, contentType){
    return s3.getSignedUrl("putObject",{
    Key: objectId,
    Bucket: bucketName,
    Expires: 900,
    ContentType: contentType,
    });
    }
    
    function addToDatabase(uuid, featured) {
  con.connect(function(err) {
    if (err) throw err;

    let sql = `INSERT INTO gifs (uuid, createdtime, featured) VALUES ('${uuid}', now(), '${featured}')`;  

    con.query(sql, function(err) {throw err;});
  });
}

function getFromDatabase(uuid) {
  con.connect(function(err) {
    if (err) throw err;

    let sql = `SELECT * FROM gifs WHERE uuid = '${uuid}'`;

    con.query(sql, function(err, result) {
      if (err) throw err;
      console.log(result);

      //TODO result
    }); 
  });
}
    


