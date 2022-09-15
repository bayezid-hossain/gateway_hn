const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

var bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
app.use(express.json());
const catchAsyncErrors = require('./middleware/catchAsyncErrors');

const error = catchAsyncErrors(async (err, req, res, options) => {
  res
    .status(400)
    .json({
      status: 'Fail',
      message: `There was an error connecting to the service ${err}`,
    })
    .send();
});

const restream = async function (proxyReq, req, res, options) {
  if (
    req.headers['content-type'] &&
    req.headers['content-type'].match(/^multipart\/form-data/)
  ) {
    // build a string in multipart/form-data format with the data you need
    const formdataUser =
      `--${req.headers['content-type'].replace(
        /^.*boundary=(.*)$/,
        '$1'
      )}\r\n` +
      `Content-Disposition: form-data; name="reqUser"\r\n` +
      `\r\n` +
      `\r\n`;

    // set the new content length
    proxyReq.setHeader(
      'Content-Length',
      parseInt(req.headers['content-length']) + Buffer.byteLength(formdataUser)
    );

    proxyReq.write(formdataUser);
  } else {
    const body = JSON.stringify({ ...req.body, formType: 'json-body' });
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(body));
    proxyReq.write(body);
  }
};

const {
  ADMIN_API,
  DRIVER_API,
  BUSOWNER_API_LOCAL,
  ADMIN_API_LOCAL,
  DRIVER_API_LOCAL,
  QR_API_LOCAL,
  QR_API,
  BUSOWNER_API,
  AUTH_API,
  AUTH_API_LOCAL,
} = require('./URLS');

const optionsAdmin = {
  target: ADMIN_API,
  changeOrigin: true,
  logger: console,
  onError: error,
  onProxyReq: restream,
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  },
};
const optionsAuth = {
  target: AUTH_API,
  changeOrigin: true,
  logger: console,
  onError: error,
  onProxyReq: restream,
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  },
};

const optionsBusOwner = {
  target: BUSOWNER_API,
  changeOrigin: true,
  logger: console,
  onError: error,
  onProxyReq: restream,
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    console.log(proxyRes.headers);
  },
};
const optionsQR = {
  target: QR_API,
  changeOrigin: true,
  logger: console,
  onError: error,
  onProxyReq: restream,
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  },
};
const optionsDriver = {
  target: DRIVER_API,
  changeOrigin: true,
  logger: console,
  onError: error,
  onProxyReq: restream,
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  },
};
const adminProxy = createProxyMiddleware(optionsAdmin);
const driverProxy = createProxyMiddleware(optionsDriver);
const busownerProxy = createProxyMiddleware(optionsBusOwner);
const authProxy = createProxyMiddleware(optionsAuth);
const qrProxy = createProxyMiddleware(optionsQR);

app.use('/api/v1/busowner', busownerProxy);

app.use('/api/v1/driver', driverProxy);
app.use('/api/v1/admin', adminProxy);
app.use('/api/v1/auth', authProxy);
app.use('/api/v1/qr', qrProxy);
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
const images = require('./routes/images');
app.use('', images);
app.listen(8000, () => {
  console.log('GateWay listening to port 8000');
});
