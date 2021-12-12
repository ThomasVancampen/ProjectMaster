const express = require('express');
const AWS = require('aws-sdk');
const axios = require('axios');
const {v4} = require("uuid");
const cors = require('cors');

const app = express();

app.use(express.json());

app.get('/hello', (req, res) => {
    res.json('Hello world!');
});

app.post('/exchange-code', (req, res)=>{
    const {code} = req.body;
    const grant_type = 'authorization_code';
    const client_id = '31aitoocsfhst2ro33pldaj30u';
    const redirect_uri = 'http://localhost:5500/callback.html';
    const client_secrete = 'bo8igterhbm1aiibv5ph53lta816t4n3qlbduhgqtfgs6a8bb6o';

    const params = new URLSearchParams({grant_type}, client_id, redirect_uri, code);



    axios.post(' https://idplab-ictarch-2021.auth.eu-central-1.amazoncognito.com/oauth2/token',
    params.toString(),
    {
        auth: {
            username: client_id,
            password: client_secrete,
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
app.use(express.static('../front'));
app.use(express.json());
app.get('/', (req, res) => {
res.json('Hello world!');
});


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
  });
});

app.post('/signaluploadcompleted',(req,res)=>{
const {uploadUrls} = req.body;

const objectIds = uploadUrls.map(uploadUrl => extractObjectId(uploadUrl));
const inputImageUrls = objectIds.map(objectId => generateGetUrl(objectId));

const outputObjectId = v4();
console.log('Output object id: ',outputObjectId);
const outputImageUrl = generatePutUrl(outputObjectId, 'image/gif');

axios.post('https://msw31oj97f.execute-api.eu-west-1.amazonaws.com/Prod/generate/gif', {inputImageUrls,outputImageUrl},
{headers:{
    'x-api-key': 'SIdHi3lzwma61h4GeBGR96ZD4rpsa3mb6iKVlMG7 '
    }
})
.then(function (response) {
res.json(outputObjectId);
})
.catch(function (error) {
res.status(500).json(error);
});
});

app.listen(3000, () => {
    console.log('Started api on http://localhost:3000')
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
    


