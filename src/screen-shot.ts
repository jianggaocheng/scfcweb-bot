import sharp from 'sharp';

const FOLDER = `screenshot/2022-07-17`;

(async () => {
  let srcImagePath = `${FOLDER}/1.png`;
  let maskedImagePath = `${FOLDER}/1_masked.png`;

  const watermark = Buffer.from(`<svg>
    <text x="0" y="60" font-size="48" fill="#000">1号楼</text>
  </svg>`);

  await sharp(srcImagePath)
    .composite([{ input: watermark, gravity: "west"}])
    .toFile(maskedImagePath);
    
    
  // const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  // let image = await Jimp.read(srcImagePath);
  // await image.print(font, 10, 10, '1 号楼');
  // await image.print(font, 10, 200, '公众号: 这里是春风南岸');
  // await image.write(maskedImagePath);
})();