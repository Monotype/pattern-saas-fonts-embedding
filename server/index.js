import express from "express";
import path from "path";

const app = express();

const fontPath = path.resolve("fonts/MyFont.woff2");

app.get("/fonts/myfont", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.sendFile(fontPath);
});

app.listen(3000, () => {
  console.log("Font server running on http://localhost:3000");
});
