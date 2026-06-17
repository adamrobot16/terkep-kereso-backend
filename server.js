const express = require('express');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/scrape', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: 'Nincs URL megadva' });
    }

    try {
        // 1. Álcázzuk magunkat igazi Chrome böngészőnek! (Bot-védelem megkerülése)
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        // Ha a szerver mégis letiltana, azt most már látni fogjuk
        if (!response.ok) {
            return res.status(response.status).json({ error: `A céloldal elutasította a kérést (Hiba: ${response.status})` });
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const images = [];

        // 2. Az okosított keresés: Kiskép helyett a nagy képet vesszük!
        $('img').each((index, element) => {
            let finalUrl = $(element).attr('src');
            
            // Megnézzük a "szülőt" (a linket, amibe be van ágyazva)
            const parentLink = $(element).closest('a');

            if (parentLink.length > 0) {
                const href = parentLink.attr('href');
                // Ha a link egy képnézegető (fancybox) vagy maga a link egy képfájlra mutat
                if (href && (parentLink.attr('data-fancybox') === 'images' || href.match(/\.(jpeg|jpg|gif|png|webp)$/i))) {
                    finalUrl = href; // Akkor felülírjuk a kisképet a nagy linkjével!
                }
            }

            // Ha találtunk valamit, és az tényleg egy link, elmentjük
            if (finalUrl) {
                images.push(finalUrl);
            }
        });

        res.json({ images: images });

    } catch (error) {
        res.status(500).json({ error: 'Hálózati hiba történt a weboldal letöltésekor.' });
    }
});

app.listen(3000, () => {
    console.log('A Térkép Kereső szerver fut a 3000-es porton!');
});
