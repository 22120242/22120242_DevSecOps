const express = require('express');
const { exec } = require('child_process');

const app = express();

/**
 * XSS - reflected
 * Semgrep chắc chắn detect
 */
app.get('/search', (req, res) => {
  const q = req.query.q;
  res.send(`<h1>${q}</h1>`); // XSS
});

/**
 * Command Injection
 * Semgrep detect rất mạnh
 */
app.get('/ping', (req, res) => {
  const host = req.query.host;
  exec(`ping -c 1 ${host}`, (err, stdout) => { // command injection
    res.send(stdout);
  });
});

app.listen(3000, () => {
  console.log("Vulnerable app running on port 3000");
});
