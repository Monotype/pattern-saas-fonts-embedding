import path from "path";
import express from "express";

const app = express();

app.get("/fonts/myfont", (req, res) => {
  res.sendFile(path.resolve("fonts/MyFont.woff2"));
});

app.listen(3000, () => {
  console.log("Font server running on http://localhost:3000");
});
