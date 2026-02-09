const express = require('express');
const app = express();

app.get('/search', (req, res) => {
  const q = req.query.q;   // unsanitized input
  res.send("You searched for: " + q); // XSS
});

app.listen(3000, () => {
  console.log("App running on port 3000");
});
