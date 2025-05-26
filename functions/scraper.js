import puppeteer from 'puppeteer';

const scrapeData = async () => {
    const browser = await puppeteer.launch({
        headless: true,
    })
    const page = await browser.newPage();
    await page.goto("https://reboks.nus.edu.sg/nus_public_web/public/index.php/facilities/capacity",
        {
            waitUntil: "domcontentloaded",
        });
    const data = await page.evaluate(() => {
        const ref = document.querySelectorAll("div.gymbox");
        console.log("hi");
        const lst = Array.from(ref).map((item) => {
            const gymname = item.querySelector("span").innerText;
            const capacity = item.querySelector("b").innerText;
            return {gymname: gymname, capacity: capacity};
        });
        return lst;
    });
    await browser.close();
    return data;
};
exports.scrapeData = scrapeData;
