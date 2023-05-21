const puppeteer = require('puppeteer');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
  try {
    // 스크린샷 폴더 생성
    fs.mkdirSync('screenshot', { recursive: true });

    // 브라우저 실행
    const browser = await puppeteer.launch({ headless: false });

    // 로그인 페이지
    const page = await browser.newPage();
    await page.goto('https://dhlottery.co.kr/user.do?method=login&returnUrl=', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#userId');
    await page.type('#userId', process.env.ID);
    await page.type('.form input[type=password]:nth-child(2)', process.env.PASSWORD);
    await page.click('.form > a');
    await page.waitForTimeout(1000);

    // 구매 페이지
    const buyPage = await browser.newPage();
    await buyPage.goto('https://ol.dhlottery.co.kr/olotto/game/game645.do', { waitUntil: 'networkidle0' });
    await buyPage.waitForTimeout(1000);

    // 팝업 창 닫기
    const targetPages = await browser.pages();
    const popupPages = targetPages.filter(targetPage => targetPage !== buyPage);
    for (const popupPage of popupPages) {
      await popupPage.close();
    }

    // 로또 구매
    await buyPage.evaluate((val, num) => {
      document.querySelector('#selectedTab').value = val;
      for (let i = 0; i < num; i++) {
        document.querySelector('#btnSelectNum').click();
      }
    }, 1, parseInt(process.env.NUM));

    await buyPage.click('#btnBuy');
    await buyPage.click('#popupLayerConfirm > div > div.btns > input:nth-child(1)');

    // 스크린샷
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    await buyPage.screenshot({ path: `screenshot/${timestamp}.png`, fullPage: true });

    // 종료
    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
