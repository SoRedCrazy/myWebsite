// server.js
const express = require('express');
const axios = require('axios');
const app = express();
const port = 5000;

app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/projects', async (req, res) => {
  try {
    const response = await axios.get('https://api.github.com/users/SoRedCrazy/repos');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching GitHub projects:', error);
    res.status(500).send('Error fetching GitHub projects');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});