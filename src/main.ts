import puppeteer from 'puppeteer';
import logger from './lib/logger';
import utils from './lib/utils';
import moment from 'moment';
import Jimp from 'jimp';
import fs from 'fs';

const now = moment();
const FOLDER = `screenshot/` + now.format('YYYY-MM-DD');
fs.rmSync(FOLDER, {recursive: true, force: true});
fs.mkdirSync(FOLDER);

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
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

    page.screenshot({path: `${FOLDER}/${building.title}.png`});
    await utils.sleepAsync(1000);
  }
})();