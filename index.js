const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require("axios");
const cheerio = require('cheerio');

async function getQuranPages() {
    const baseUrl = 'https://old.aviny.com/quran/estekhareh/Chapters/';
    const outputDir = './quran-pages';

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
        console.log(`Created directory: ${outputDir}`);
    }

    // Download pages from 1 to 604 (typical Quran pages)
    const totalPages = 604;

    console.log(`Starting download of ${totalPages} Quran pages...`);

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pageNumber = pageNum.toString().padStart(3, '0'); // Convert 1 to "001"
        const imageUrl = `${baseUrl}p${pageNumber}.gif`;
        const outputPath = path.join(outputDir, `page_${pageNumber}.gif`);

        try {
            await downloadImage(imageUrl, outputPath);
            console.log(`✓ Downloaded page ${pageNumber}/${totalPages}`);
        } catch (error) {
            console.error(`✗ Failed to download page ${pageNumber}: ${error.message}`);
        }

        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('Download completed!');
}

function downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);

        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
            }
        }).on('error', (error) => {
            reject(error);
        });

        file.on('error', (error) => {
            reject(error);
        });
    });
}

async function getPageTafsir(page) {
    const result = await axios.get(`https://old.aviny.com/quran/estekhareh/index2.aspx?page=${page}`)
    const $ = cheerio.load(result.data);
    const generalGoodBadResult = $('#L_GoodBad_Name').text().trim();
    const generalResult = $('#L_Result_General').text().trim();
    const marriageResult = $('#L_Result_Marriage').text().trim();
    const tradeResult = $('#L_Result_Trade').text().trim();
    const chapterName = $('#L_Chapter_Name').text().trim();
    const ayeh = $('#L_Ayeh').text().trim();
    return {
        generalGoodBadResult,
        generalResult,
        marriageResult,
        tradeResult,
        chapterName,
        ayeh
    };
}

async function getTafsir() {
    const list = [];
    for (let i = 1; i <= 603; i += 2) {
        console.log("")
        let result = await getPageTafsir(i);
        list.push({
            ...result,
            page: i
        });
    }
    fs.writeFileSync('quranTafsir.json', JSON.stringify(list));
}

// Export the function
module.exports = {getQuranPages};

// If running directly, execute the function
if (require.main === module) {
    //getQuranPages().catch(console.error);
    getTafsir().catch(console.error);
}

