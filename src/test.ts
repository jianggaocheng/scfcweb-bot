import canvas from 'canvas';
import fs from 'fs';

const FOLDER = `screenshot/2022-07-17`;

(async () => {
  let srcImagePath = `${FOLDER}/1.png`;
  let maskedImagePath = `${FOLDER}/1_masked.png`;

  let image = await canvas.loadImage(fs.readFileSync(srcImagePath));
  const srcCanvas = canvas.createCanvas(image.width, image.height);
  const srcCtx = srcCanvas.getContext('2d');
  srcCtx.drawImage(image, 0, 0, image.width, image.height);
  srcCtx.font = '30px Sans';
  srcCtx.fillStyle = '#333333';
  srcCtx.fillText('#1号楼', 20, 30);
  srcCtx.font = '20px Sans';
  srcCtx.fillText('公众号: 这里是春风南岸', 20, 60);

  const buffer = srcCanvas.toBuffer();
  fs.writeFileSync(maskedImagePath, buffer);
    
  // const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  // let image = await Jimp.read(srcImagePath);
  // await image.print(font, 10, 10, '1 号楼');
  // await image.print(font, 10, 200, '公众号: 这里是春风南岸');
  // await image.write(maskedImagePath);
})();