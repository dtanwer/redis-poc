const express = require("express");
const axios = require("axios");
const responseTime = require("response-time");
const redis = require("redis");
const client = require("./radisConnection");
const app = express();

const port = 3000;
app.use(responseTime());

app.get("/rockets", async (req, res) => {
  try {
    const savedData= await client.get("rocket");
    if(savedData)
    {
        console.log("using cached data")
        res.send(JSON.parse(savedData));
        return;
    }

    const { data } = await axios.get("https://api.spacexdata.com/v3/rockets");
    await client.setEx("rocket",5,JSON.stringify(data))
    console.log("Data saved in cach");
    res.send(data);
  } catch (error) {
    res.send(error.message);
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
