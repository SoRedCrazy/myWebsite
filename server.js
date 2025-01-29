const express = require('express');
const axios = require('axios');
const fs = require('fs');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const app = express();
const port = 5000;
require('dotenv').config({path: __dirname + '/.env'})

app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', './views');

// Load QR code usage statistics from a JSON file
let qrStats = {
  review: { count: 0, ips: [] },
  truck: { count: 0, ips: [] }
};

const loadStats = () => {
  if (fs.existsSync('qrStats.json')) {
    const data = fs.readFileSync('qrStats.json');
    qrStats = JSON.parse(data);
  }
};

const saveStats = () => {
  fs.writeFileSync('qrStats.json', JSON.stringify(qrStats, null, 2));
};

loadStats();

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

app.get('/qr/review', (req, res) => {
  const ip = req.ip;
  qrStats.review.count++;
  if (!qrStats.review.ips.includes(ip)) {
    qrStats.review.ips.push(ip);
  }
  saveStats();
  res.redirect('https://g.page/r/CWZYVpjNUIM7EBM/review');
});

app.get('/qr/truck', (req, res) => {
  const ip = req.ip;
  qrStats.truck.count++;
  if (!qrStats.truck.ips.includes(ip)) {
    qrStats.truck.ips.push(ip);
  }
  saveStats();
  res.redirect('https://g.page/r/CWZYVpjNUIM7EBM');
});

// Route to display QR code usage statistics
app.get('/qr/admin', (req, res) => {
  res.json(qrStats);
});

app.get('/comptabilite', (req, res) => {
  res.render('compta');
});

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    const transactions = extractTransactions(data.text);
    const balance = calculateBalance(transactions);
    const totalSpent = calculateTotalSpent(transactions);
    res.json({ transactions, balance, totalSpent });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).send('Error processing PDF');
  }
});

app.get('/devis/accepted/:ref', (req, res) => {
  try {
    const ref = req.params.ref;
    let id = null;
    const url_get = new URL(`https://www.facturation.pro/firms/${process.env.FACTURATION_PROVIDER_FIRMID}/quotes.json`);
    url_get.searchParams.append('quote_ref', ref );

    fetch(url_get.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'boisgard plomberie (boisgardplomberie@gmail.com)',
        'Authorization': `Basic ` + Buffer.from(process.env.FACTURATION_PROVIDER_ID + ":" + process.env.FACTURATION_PROVIDER_KEY).toString('base64'),
        'Content-Type': 'application/json'
      },
    }).then(async response => {
      if (!response.ok) {
        const errorText = await response.text();
        res.render('error', { message: error.message });
        return null;
      }
      const data = await response.json();
      if (data.length > 0) {
        if (data[0].quote_status === 1 || data[0].quote_status === 9) {
          res.render('error', { message: "Devis déjà accepté ou refusé" });
          return null;
        }
        id = data[0].id;
        // Nest the second fetch here
        const url = new URL(`https://www.facturation.pro/firms/${process.env.FACTURATION_PROVIDER_FIRMID}/quotes/${id}.json`);
        return fetch(url.toString(), {
          method: 'PATCH',
          headers: {
            'User-Agent': 'boisgard plomberie (boisgardplomberie@gmail.com)',
            'Authorization': `Basic ` + Buffer.from(process.env.FACTURATION_PROVIDER_ID + ":" + process.env.FACTURATION_PROVIDER_KEY).toString('base64'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: id,
            quote_status: "1"
          })
        });
      } else {
        res.render('error', { message: "Devis introuvable" });
        return null;
      }
    })
    .then(async response => {
      if (!response) return;
      if (!response.ok) {
        const errorText = await response.text();
        res.render('error', { message: error.message });
        return null;
      }
      res.render('devis-status', { title: "Devis Accepté" ,data: "Devis " + id + " est accepté merci à vous de votre confiance !" });
    })
    .catch(error => {
      res.render('error', { message: error.message });
    });
  } catch (error) {
    res.status(500).send('Error');
  }
});


app.get('/devis/refused/:ref', upload.single('pdf'), async (req, res) => {
  try {
    const ref = req.params.ref;
    let id = null;
    const url_get = new URL(`https://www.facturation.pro/firms/${process.env.FACTURATION_PROVIDER_FIRMID}/quotes.json`);
    url_get.searchParams.append('quote_ref', ref );

    fetch(url_get.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'boisgard plomberie (boisgardplomberie@gmail.com)',
        'Authorization': `Basic ` + Buffer.from(process.env.FACTURATION_PROVIDER_ID + ":" + process.env.FACTURATION_PROVIDER_KEY).toString('base64'),
        'Content-Type': 'application/json'
      },
    }).then(async response => {
      if (!response.ok) {
        const errorText = await response.text();
        res.render('error', { message: error.message });
        return null;
      }
      const data = await response.json();
      if (data.length > 0) {
        if (data[0].quote_status === 1 || data[0].quote_status === 9) {
          res.render('error', { message: "Devis déjà accepté ou refusé" });
          return null;
        }
        id = data[0].id;
        // Nest the second fetch here
        const url = new URL(`https://www.facturation.pro/firms/${process.env.FACTURATION_PROVIDER_FIRMID}/quotes/${id}.json`);
        return fetch(url.toString(), {
          method: 'PATCH',
          headers: {
            'User-Agent': 'boisgard plomberie (boisgardplomberie@gmail.com)',
            'Authorization': `Basic ` + Buffer.from(process.env.FACTURATION_PROVIDER_ID + ":" + process.env.FACTURATION_PROVIDER_KEY).toString('base64'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: id,
            quote_status: "9"
          })
        });
      } else {
        res.render('error', { message: "Devis introuvable" });
        return null;
      }
    })
    .then(async response => {
      if (!response) return;
      if (!response.ok) {
        const errorText = await response.text();
        res.render('error', { message: error.message });
        return null;
      }
      res.render('devis-status', {title: "Devis refusé",  data: "Devis " + id + " est refusé Bonne journée à vous!" });
    })
    .catch(error => {
      res.render('error', { message: error.message });
    });
  } catch (error) {
    res.status(500).send('Error');
  }
});

const extractTransactions = (text) => {
  const transactions = [];
  const lines = text.split('\n');
  let currentTransaction = null;

  lines.forEach(line => {
    const match = line.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?\d+,\d{2})/);
    if (match) {
      if (currentTransaction) {
        transactions.push(currentTransaction);
      }
      currentTransaction = {
        date: match[1],
        description: match[3],
        amount: parseFloat(match[4].replace(',', '.'))
      };
    } else if (currentTransaction) {
      currentTransaction.description += ' ' + line.trim();
    }
  });

  if (currentTransaction) {
    transactions.push(currentTransaction);
  }

  return transactions;
};

const calculateBalance = (transactions) => {
  return transactions.reduce((acc, transaction) => acc + transaction.amount, 0).toFixed(2);
};

const calculateTotalSpent = (transactions) => {
  return transactions
    .filter(transaction => transaction.amount > 0)
    .reduce((acc, transaction) => acc + transaction.amount, 0)
    .toFixed(2);
};

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
