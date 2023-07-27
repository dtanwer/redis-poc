const express = require("express");
const axios = require("axios");

const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const responseTime = require("response-time");
const session = require("express-session");
const client = require("./radisConnection");
const path = require("path");
const app = express();
const options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Systumm",
			version: "1.0.0",
			description: "A simple Express Systumm API",
		},
		servers: [
			{
				url: "http://localhost:3000",
			},
		],
	},
	apis: ["./routes/*.js"],
};

const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "deep",
    cookie: { maxAge: 100000 },
  })
);

app.use(responseTime());

const specs = swaggerJsDoc(options);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const pass = await client.get(username);
  if (!pass) {
    res.send("User Not Found");
    return;
  }
  if (password === pass) {
    req.session.authorized = true;
    res.redirect("/home");
    return;
  }
  res.send("Wrong Password!!!");
});
app.post("/signUp", async (req, res) => {
  const { username, password } = req.body;
  const user = await client.get(username);
  if (user) {
    res.send("User Already Exist!!!");
    return;
  }
  await client.setEx(username, 60, password);
  res.redirect("/");
});

app.get("/signUp", async (req, res) => {
  if (req.session.authorized) {
    res.redirect("/home");
    return;
  }
  res.sendFile(path.join(__dirname, "./signUp.html"));
});

app.get("/", async (req, res) => {
  if (req.session.authorized) {
    res.redirect("/home");
    return;
  }
  res.sendFile(path.join(__dirname, "./login.html"));
});

app.get("/home", async (req, res) => {
  if (req.session.authorized) {
    res.sendFile(path.join(__dirname, "./home.html"));
  } else {
    res.send("Login Krle Bhai :)");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/rockets", async (req, res) => {
  if (!req.session.authorized) {
    res.send("Login krle bhai :)");
    return;
  }
  try {
    const savedData = await client.get("rocket");
    if (savedData) {
      console.log("using cached data");
      res.send(JSON.parse(savedData));
      return;
    }

    const { data } = await axios.get("https://api.spacexdata.com/v3/rockets");
    await client.setEx("rocket", 5, JSON.stringify(data));
    console.log("Data saved in cach");
    res.send(data);
  } catch (error) {
    res.send(error.message);
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
