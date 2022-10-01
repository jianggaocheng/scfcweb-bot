import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import logger from './lib/logger';
import utils from './lib/utils';
import moment from 'moment';
import canvas from 'canvas';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import MpApi from './lib/mp-api';

const now = moment();
const FOLDER = `screenshot/` + now.format('YYYY-MM-DD');
fs.rmSync(FOLDER, {recursive: true, force: true});
fs.mkdirSync(FOLDER);

const fileList = fs.readdirSync(FOLDER);
const maskedFileList = _.sortBy(_.filter(fileList, (i) => _.includes(i, 'masked')), (i) => _.toInteger(i.match(/\d+/)[0]));

const mpApi = new MpApi('wxce11de71b82a9f8b', '5a8eb74b02a8951fa7484b981966553b');
const TEMPLATE = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, 'template/post.handlebars')).toString());

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

  const reportModel: any = {
    projectList: [],
    total: 0,
    sold: 0,
    ratio: 0,
    reportDate: now.format('YYYY/MM/DD HH:mm:ss')
  };

  let projectList = await page.$$eval('#MainContent_OraclePager1 > tbody td > a', (els,) => els.map( el => {
    return {
      el: el,
      href: (el as any ).href,
      title: (el as any ).innerText
    };
  }));

  for (let i = 0; i < (projectList as any).length; i++) {
    const project: any = (projectList as any)[i];
    logger.debug(`开始访问 ${project.title}`);
    await utils.randomSleepAsync();
    
    const currentProjectModel: any = {
      project: project.title,
      total: 0,
      sold: 0,
      ratio: 0,
      buildingList: []
    };
    
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

    for (let i = 0; i < (currentBuildingList as any).length; i++) {
      const building: any = (currentBuildingList as any)[i];
      logger.debug(`查看楼栋 [${building.title}] 状态`);
  
      await Promise.all([
        page.waitForNavigation(),
        page.goto(building.href, {
          referer: await page.url()
        })
      ]);
  
      // Calculate sales
      const currentBuildingModel: any = {};
      let houseList = await page.$$eval('#MainContent_gvxml td', (els,) => els.map( el => {
        const COLOR_HOUSE_MAP: any = {
          'white': -1,
          'rgb(102, 204, 51)': 0,
          'yellow': 1,
          'rgb(204, 204, 204)': 2,
          'rgb(102, 102, 0)': 3
        }
        let status = COLOR_HOUSE_MAP[(el as any).style.backgroundColor];
        return {
          status: status,
          houseSN: (el as any ).innerText
        };
      }));
  
      houseList = _.reject(houseList, house => house.status === -1);
      currentBuildingModel.building = building.title;
      currentBuildingModel.total = houseList.length;
      currentBuildingModel.unsell = _.filter(houseList, {status: 0}).length;
      currentBuildingModel.selling = _.filter(houseList, {status: 1}).length;
      currentBuildingModel.sold = _.filter(houseList, {status: 2}).length;
      currentBuildingModel.locked = _.filter(houseList, {status: 3}).length;
      currentProjectModel.buildingList.push(currentBuildingModel);
      currentProjectModel.total += currentBuildingModel.total;
      currentProjectModel.sold += currentBuildingModel.selling + currentBuildingModel.sold;

      // Make screenshots
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
    
    currentProjectModel.buildingList = _.sortBy(currentProjectModel.buildingList, (item) => _.toNumber(item.building));
    currentProjectModel.ratio += _.round(currentProjectModel.sold / currentProjectModel.total, 2);
    reportModel.projectList.push(currentProjectModel);
    reportModel.total += currentProjectModel.total;
    reportModel.sold += currentProjectModel.sold;
  }

  reportModel.projectList = [reportModel.projectList[0], reportModel.projectList[2], reportModel.projectList[1]]
  reportModel.ratio = _.round(reportModel.sold / reportModel.total, 2);

  // Upload media
  const fileList = fs.readdirSync(FOLDER);
  const maskedFileList = _.sortBy(_.filter(fileList, (i) => _.includes(i, 'masked')), (i) => _.toInteger(i.match(/\d+/)[0]));
  const uploadImgList = [];
  for (let i=0; i<maskedFileList.length; i++) {
    const uploadImgUrl = await mpApi.uploadImg(path.resolve(FOLDER, maskedFileList[i]));
    uploadImgList.push(uploadImgUrl);
  }
  reportModel.uploadImgList = uploadImgList;

  await mpApi.postDraft(`春风南岸花园网签日报 ${now.format('YYMMDD')}`, TEMPLATE(reportModel));
  browser.close();
})();