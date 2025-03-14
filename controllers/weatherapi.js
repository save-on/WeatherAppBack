require("dotenv").config();

const searchWeather = async (req, res) => {
  const { location } = req.body;
  try {
    const response = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        location
      )}&limit=5&appid=${process.env.WEATHER_API_KEY}`
    );

    const data = await response.json();
    if (response.ok) {
      const filtered = data.filter(
        (c) => c.name.toLowerCase() === location.toLowerCase()
      );
      if (filtered.length > 0) {
        return res.json(filtered);
      } else {
        return res.json(null);
      }
    }
    res.status(response.status).json({ error: data.message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Weather data failed to fetch" });
  }
};

module.exports = { searchWeather };
