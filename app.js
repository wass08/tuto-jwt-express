const jwt = require('jsonwebtoken');
require('dotenv').config();

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

const user = {
  id: 42,
  name: 'Jean bon',
  email: 'jeanbon@gmail.com',
  admin: true,
};

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1800s'});
}


function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '1y'});
}



app.post('/api/login', (req, res) => {

  // TODO: checker en BDD le user par rapport à l'email
  if (req.body.email !== user.email) {
    res.status(401).send('invalid credentials');
    return ;
  }
  if (req.body.password !== 'cuillere') {
    res.status(401).send('invalid credentials');
    return ;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  res.send({
    accessToken,
    refreshToken,
  });

});

app.post('/api/refreshToken', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(401);
    }
    // TODO : check en bdd que le user a toujours les droit et qu'il existe toujours
    delete user.iat;
    delete user.exp;
    const refreshedToken = generateAccessToken(user);
    res.send({
      accessToken: refreshedToken,
    });
  });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(401);
    }
    req.user = user;
    next();
  });
}

app.get('/api/me', authenticateToken, (req, res) => {
  res.send(req.user);
});

app.listen(3000, () => {console.log('Server running on port 3000')});