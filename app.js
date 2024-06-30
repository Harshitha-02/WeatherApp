const express = require("express");
const https = require('https');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); 

const apiKey = "636ab00299512d9b78d7ae89ebf90f7c"; 

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/", (req, res) => {
    const query = req.body.cityName;
    const unit = "metric";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=${unit}`;

    https.get(url, (response) => {
        response.on("data", (data) => {
            const weatherData = JSON.parse(data);
            const temp = weatherData.main.temp;
            const des = weatherData.weather[0].description;
            const icon = weatherData.weather[0].icon;
            const humidity = weatherData.main.humidity;
            const windSpeed = weatherData.wind.speed;
            const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

            const htmlResponse = `
                <h1>Temperature: ${temp} °C</h1>
                <h1>Description: ${des}</h1>
                <h1>Humidity: ${humidity}%</h1>
                <h1>Wind Speed: ${windSpeed} m/s</h1>
                <img src="${iconUrl}">
                <h2 id="date-time">${new Date().toLocaleString()}</h2>
            `;
            
            res.write(htmlResponse);
            res.send();
        });
    });
});

app.get('/historical-weather-data', (req, res) => {
    const query = req.query.city;
    const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=1&appid=${apiKey}`;

    https.get(geocodeUrl, (geoResponse) => {
        geoResponse.on("data", (geoData) => {
            const geoLocation = JSON.parse(geoData)[0];
            const lat = geoLocation.lat;
            const lon = geoLocation.lon;
            const oneCallUrl = `https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${Math.floor(Date.now() / 1000)}&appid=${apiKey}&units=metric`;

            https.get(oneCallUrl, (response) => {
                let data = '';
                response.on("data", (chunk) => {
                    data += chunk;
                });
                response.on("end", () => {
                    const historicalData = JSON.parse(data);
                    const temps = historicalData.hourly.map(hour => ({
                        date: new Date(hour.dt * 1000).toISOString(),
                        temp: hour.temp
                    }));
                    res.json(temps);
                });
            });
        });
    });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});