import puppeteer from 'puppeteer';
import logger from './lib/logger';
import utils from './lib/utils';
import moment from 'moment';
import canvas from 'canvas';
import fs from 'fs';

const now = moment();
const FOLDER = `screenshot/` + now.format('YYYY-MM-DD');
fs.rmSync(FOLDER, {recursive: true, force: true});
fs.mkdirSync(FOLDER);

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({
    height: 720,
    width: 360
  });
  await page.goto('http://spf.szfcweb.com/szfcweb/DataSerach/SaleInfoProListIndex.aspx');
  await page.type('#MainContent_txt_Pro', '春风南岸花园');
  await page.select('#MainContent_ddl_RD_CODE', '高新区');
  await Promise.all([
    page.waitForNavigation(),
    page.click('#MainContent_bt_select')
  ]);

  let projectList = await page.$$eval('#MainContent_OraclePager1 > tbody td > a', (els,) => els.map( el => {
    return {
      el: el,
      href: (el as any ).href,
      title: (el as any ).innerText
    };
  }));

  let buildingList: any = [];

  for (let i = 0; i < (projectList as any).length; i++) {
    const project: any = (projectList as any)[i];
    logger.debug(`开始访问 ${project.title}`);
    await utils.randomSleepAsync();

    await Promise.all([
      page.waitForNavigation(),
      page.goto(project.href, {
        referer: await page.url()
      })
    ]);

    let currentBuildingList = await page.$$eval('#MainContent_OraclePager1 > tbody td > a', (els,) => els.map( el => {
      return {
        href: (el as any ).href,
        title: (el as any ).innerText
      };
    }));

    buildingList = buildingList.concat((currentBuildingList as any));
  }

  for (let i = 0; i < (buildingList as any).length; i++) {
    const building: any = (buildingList as any)[i];
    logger.debug(`查看楼栋 [${building.title}] 状态`);

    await Promise.all([
      page.waitForNavigation(),
      page.goto(building.href, {
        referer: await page.url()
      })
    ]);

    let srcImagePath = `${FOLDER}/${building.title}.png`;
    let maskedImagePath = `${FOLDER}/masked_${building.title}.png`;
    await page.screenshot({path: srcImagePath});
    
    let image = await canvas.loadImage(fs.readFileSync(srcImagePath));
    const srcCanvas = canvas.createCanvas(image.width, image.height);
    const srcCtx = srcCanvas.getContext('2d');
    srcCtx.drawImage(image, 0, 0, image.width, image.height);
    srcCtx.font = '30px Sans';
    srcCtx.fillStyle = '#333333';
    srcCtx.fillText(`#${building.title}号楼 ${now.format('YYYY-MM-DD')}`, 20, 40);
    srcCtx.font = '20px Sans';
    srcCtx.fillText('公众号: 这里是春风南岸', 20, 70);
  
    const buffer = srcCanvas.toBuffer();
    fs.writeFileSync(maskedImagePath, buffer);

    await utils.sleepAsync(1000);
  }

  browser.close();
})();