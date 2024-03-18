const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ojvobggipcddytoifkqv.supabase.co';
const ayty = 'http://localhost:3334'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdm9iZ2dpcGNkZHl0b2lma3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5MTY4NzgxMiwiZXhwIjoyMDA3MjYzODEyfQ.oSAg4jqsd67txokeBVhYmL9L8mJkKf32XKM1OAHDpLA';
const supabase = createClient(supabaseUrl, supabaseKey);
const bucketName = 'teste-file';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const app = express();

app.use(express.static('public'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use(express.json());

let startData = {};
let arrayMessage = [];
let agentName = '';

app.use((req, res, next) => {
  res.header(
    'Access-Control-Allow-Origin',
    '/'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;

    if (!file) {
      return res.json({
        success: false,
        message: 'Nenhum arquivo foi enviado.',
      });
    }

    console.log(1, file);

    const miniType = file.mimetype.split('/');
    const originalname = file.originalname.split('.');
    let fileName = path.basename(file.originalname);

    let tipo = '';

    if (['mp4'].includes(miniType[1])) {
      tipo = 'Video';
    }

    console.log(2, originalname)

    const sendName = Math.floor(Math.random() * 101) + originalname[0].replace(/[.,\\/#!$%\\^&?><+\\*;:{}=\-_`~()@\\']/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Ç/g, 'C').replace(/ç/g, 'c').replace(/ /g, '_') + `.${originalname[1]}`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(sendName, file.buffer);

    if (error) {
      return res.json({
        success: false,
        message: 'Erro ao fazer upload do arquivo.',
      });
    }

    const downloadUrl = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.Key);

    const dataOrq = {};

    if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(originalname[1])) {
      tipo = 'Image';
    }

    if (['pdf', 'txt', 'plain', 'ppt', 'pptx', 'ppx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'pps', 'rtf', 'xlsx', 'doc', 'docx', 'document', 'xls'].includes(originalname[1])) {
      tipo = 'Document';
    }

    if (['ogg', 'mp3', 'mpeg', 'mpega', 'wav'].includes(originalname[1])) {
      tipo = 'Audio';
    }

    const finalUrl = `https://ojvobggipcddytoifkqv.supabase.co/storage/v1/object/public/teste-file/${sendName}`;
    dataOrq.id = startData.id;
    dataOrq.session_key = startData.session_key;
    dataOrq.id_bot = startData.id_bot;
    dataOrq.api_key = startData.api_key;
    dataOrq.type = tipo;
    dataOrq.when = new Date().toString();
    dataOrq.message = finalUrl;

    console.log('{ success: true, data: { url:{ data: { publicUrl: finalUrl } } } }', { data: { publicUrl: finalUrl }} )
    
    let returnPost = true;

    await axios.post(`${ayty}/human/message`, dataOrq)
      .then(res => console.log(res))
      .catch(() => returnPost = false);
    
    if(returnPost) {
      arrayMessage.push({
        tipo,
        agente: true,
        message: finalUrl,
      });
    }
    return res.json({ success: returnPost });
  } catch (error) {
    return res.json({ success: false, message: 'Erro no servidor.' });
  }
});

app.get('/message-show', (req, res) => res.json(arrayMessage));

app.post('/set-agent-name', (req, res) => {
  agentName = req.body.agentName;

  return res.json(agentName);
});

app.post('/zerar-array', (req, res) => {
  axios.post(`${ayty}/human/finalize`, startData);

  arrayMessage = [];

  return res.json(arrayMessage);
});

app.post('/base', (req, res) => {
  const { base } = req.body;
  const { tipo } = req.body;

  const data = {};

  let tipoMsg = 'Text';

  if (tipo.includes('image')) {
    tipoMsg = 'Image';
  }

  data.id = startData.id;
  data.session_key = startData.session_key;
  data.id_bot = startData.id_bot;
  data.api_key = startData.api_key;
  data.type = tipoMsg;
  data.when = new Date().toString();
  data.message = base;

  axios.post(`${ayty}/human/message`, data);

  return res.json(base);
});

app.get('/filas', (req, res) => {
  const retorno = [
    {
      _id: '123',
      name: 'Fila Suporte',
      api_key: 'ABC123',
    },

    {
      _id: '321',
      name: 'Fila Ouvidoria',
      api_key: 'ABC123456',
    },
  ];

  res.json(retorno);
});

app.get('/disponivel/:service_id', (req, res) => {
  res.status(200).json(true);
  // if(req.params.service_id === '123'){
  // } else {
  //   res.status(404).json({
  //     code: '010',
  //     message: 'Sem Agentes Disponíveis'
  //   });
  // }
});

app.post('/start', (req, res) => {
  
  req.body.histories.forEach((item) => {
    const obj = {
      bot: item.bot,
      message: item.message,
    };
    arrayMessage.push(obj);
  });

  startData = req.body;

  res.send('ok');
});

app.post('/message-recive', (req, res) => {
  const { body } = req;

  const data = {};

  data.id = startData.id;
  data.session_key = startData.session_key;
  data.message = body.message;
  data.type = 'Text';
  data.agent_name = agentName.length === 0 ? 'Agente' : agentName;
  data.when = new Date().toString();

  arrayMessage.push({
    agente: true,
    message: body.message,
  });

  axios.post(`${ayty}/human/message`, data);

  res.send('ok');
});

app.post('/message', (req, res) => {
  const { body } = req;

  let isText = true;

  if (['Image', 'Video', 'Document', 'Audio'].includes(body.type)) {
    isText = false;
  }

  arrayMessage.push({
    bot: false,
    message: isText ? body.message : 'Cliente enviou um arquivo',
  });

  res.send('ok');
});

app.post('/end', (req, res) => {
  arrayMessage = [];

  res.send('ok');
});

app.post('/sts', (req, res) => {
  const data = {};

  data.id = startData.id;
  data.session_key = startData.session_key;
  data.id_bot = startData.id_bot;
  data.api_key = startData.api_key;
  data.status = 'delivered';
  data.when = new Date().toString();

  res.json(data);
});

app.listen(8181, console.log('iniciado 8181'));