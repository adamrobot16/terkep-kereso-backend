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
        console.log(`\n--- ÚJ KERESÉS: ${targetUrl} ---`);
        
        // Extra fejlécek (pl. Referer), hogy még hitelesebb böngészőnek tűnjünk
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.google.com/' 
            }
        });

        if (!response.ok) {
            console.log(`Hiba: A szerver ${response.status} kóddal válaszolt.`);
            return res.status(response.status).json({ error: `Szerver hiba: ${response.status}` });
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Set-et használunk, hogy kiszűrjük a véletlenül duplikált linkeket
        const images = new Set(); 

        // 1. Elsődleges célpont: Keresés direktben a data-fancybox attribútumra!
        $('a[data-fancybox="images"]').each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
                images.add(href);
            }
        });

        // 2. Biztonsági háló: ha nincs fancybox, megpróbáljuk a sima képeket (mint a legelső kódnál)
        if (images.size === 0) {
            $('img').each((index, element) => {
                const src = $(element).attr('src');
                if (src) {
                    images.add(src);
                }
            });
        }

        // Átalakítjuk a Set-et sima tömbbé
        const finalImages = Array.from(images);

        // DETEKTÍV MÓD: Mit lát valójában a szerver?
        if (finalImages.length === 0) {
            const pageTitle = $('title').text().trim();
            console.log(`[FIGYELMEZTETÉS] Nulla képet találtunk!`);
            console.log(`[DETEKTÍV] A letöltött oldal címe ez volt: "${pageTitle}"`);
        } else {
            console.log(`[SIKER] Talált képek száma: ${finalImages.length}`);
        }

        res.json({ images: finalImages });

    } catch (error) {
        console.error("Hálózati hiba:", error.message);
        res.status(500).json({ error: 'Hálózati hiba történt a weboldal letöltésekor.' });
    }
});

app.listen(3000, () => {
    console.log('A Térkép Kereső szerver fut a 3000-es porton!');
});
