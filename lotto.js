const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
  try{

    // screenshot 폴더 생성
    fs.readdir('screenshot', (err) => {
      if (err) {
          console.error('screenshot 폴더가 없어 screenshot 폴더를 생성합니다.');
            fs.mkdirSync('screenshot');
        }
    });


    // launch - chrome 실행. 
    // headless - ui를 제공 여부. false -> ui가 보여줌, true -> 백그라운드에서만 켜짐
    const browser = await puppeteer.launch({headless: false});


    // new Page
    const page = await browser.newPage();

    // 쿠키 초기화
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');

    // Move url
    await page.goto('https://dhlottery.co.kr/user.do?method=login&returnUrl=',{
      waitUntil: 'networkidle0'
    });


    // ID, PW
    await page.waitForSelector('#userId');
    // evaluate - Javascript 코드를 사용할 수 있게 해준다.
    await page.evaluate((id,pw) => {
      document.querySelector('#userId').value = id;
      // 코드 축약
      document.querySelector('.form input[type=password]:nth-child(2)').value = pw;
    }, process.env.ID, process.env.PASSWORD);


    // Login Button Click
    await page.click(".form > a");

    // 1초 기다리기.
    await page.waitForTimeout(1000);

    const buyPage = await browser.newPage();
                        
    await buyPage.goto('https://ol.dhlottery.co.kr/olotto/game/game645.do',{
      waitUntil: 'networkidle0'
    });
    await buyPage.waitForTimeout(1000);

    // Buy
    await buyPage.evaluate((val) => {
      document.querySelector('#selectedTab').value = val;
    },1);

    await buyPage.waitForSelector('#btnSelectNum');
    for(var i = 0; i < process.env.NUM; i++){
      await buyPage.click("#btnSelectNum");
    }
    
    await buyPage.click('#btnBuy')
    await buyPage.click('#popupLayerConfirm > div > div.btns > input:nth-child(1)')

    // 현재 날짜
    Date.prototype.YYYYMMDDHHMMSS = function () {
      var yyyy = this.getFullYear().toString();
      var MM = pad(this.getMonth() + 1,2);
      var dd = pad(this.getDate(), 2);
      var hh = pad(this.getHours(), 2);
      var mm = pad(this.getMinutes(), 2)
      var ss = pad(this.getSeconds(), 2)
    
      return yyyy +  MM + dd+  hh + mm + ss;
    };
  
    function pad(number, length) {
      var str = '' + number;
      while (str.length < length) {
        str = '0' + str;
      }
      return str;
    }
    
    // 스크린샷
    await buyPage.screenshot({ path: `screenshot/${new Date().YYYYMMDDHHMMSS()}.png`, fullPage: true });

    // 종료
    await browser.close();

  } catch(e){
    console.error(e);
  }
})();