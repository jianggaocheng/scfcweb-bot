import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto('http://baidu.com');
  await page.$eval('a', e => {
    console.log(e);
  });
})();