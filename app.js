const chromium = require('chrome-aws-lambda');

exports.handler = async (event) => {
  try {
    const executablePath = await chromium.executablePath;
    let browser = null;
    let page = null;
    let pdf = null;
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    console.log('>>>>> Lambda executes <<<<<<');

    browser = await chromium.puppeteer.launch({
        dumpio: true,
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless:  true,
        ignoreHTTPSErrors: true,
    });
    page = await browser.newPage();
    
    await page.setContent("<!DOCTYPE html><html><head><meta charset='utf-8' /><title>Jura Online Rechnung</title></head><body><h1>Hello world!</h1></body></html>");

    pdf = await page.pdf({ 
      format: 'a4',
      printBackground: true,
      margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
    }});

    console.log(pdf);

    await browser.close();
  } catch (err) {
    console.log('Exception happenned while using chronium');
    console.log(err);
    return err;
  }
};