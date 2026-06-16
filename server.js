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
        const response = await fetch(targetUrl);
        const html = await response.text();

        // HTML betöltése és elemzése a Cheerio segítségével
        const $ = cheerio.load(html);
        const images = [];

        // Összes <img> címke megkeresése
        $('img').each((index, element) => {
            // 1. Alapértelmezésként megnézzük a sima img src-t (ez a kiskép)
            let finalUrl = $(element).attr('src');

            // 2. Megkeressük, hogy a kép egy <a> (link) címkén belül van-e
            const parentLink = $(element).closest('a');

            if (parentLink.length > 0) {
                // Ha van data-fancybox attribútuma, vagy az href .jpg/.png-re végződik
                const href = parentLink.attr('href');
                if (href && (parentLink.attr('data-fancybox') === 'images' || href.match(/\.(jpeg|jpg|gif|png|webp)$/i))) {
                    // Akkor a nagy képet (a link célját) mentjük el!
                    finalUrl = href;
                }
            }

            // 3. Ha találtunk valamilyen URL-t, betesszük a listába
            if (finalUrl) {
                images.push(finalUrl);
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
