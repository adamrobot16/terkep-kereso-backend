const express = require('express');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors()); // Engedélyezzük, hogy a HTML oldalunk beszélhessen a szerverrel

app.get('/scrape', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: 'Nincs URL megadva' });
    }

    try {
        // Cél weboldal letöltése
        const response = await fetch('https://terkep-kereso-backend.onrender.com/scrape?url=${encodeURIComponent(url)}');
        const html = await response.text();

        // HTML betöltése és elemzése a Cheerio segítségével
        const $ = cheerio.load(html);
        const images = [];

        // Összes <img> címke megkeresése
        $('img').each((index, element) => {
            const src = $(element).attr('src');
            if (src) {
                images.push(src);
            }
        });

        // Eredmény visszaküldése a HTML oldalnak
        res.json({ images: images });
    } catch (error) {
        res.status(500).json({ error: 'Nem sikerült letölteni a megadott oldalt.' });
    }
});

app.listen(3000, () => {
    console.log('A szerver fut a http://localhost:3000 címen');
});
