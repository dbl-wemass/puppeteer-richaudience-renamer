//https://platform.richaudience.com/login


const login = (page, processData = {}) => new Promise(async (resolve, reject) => {
  try {
    //   page
    // .on('console', message =>
    //   console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
    // .on('pageerror', ({ message }) => console.log(message))
    // .on('response', response =>
    //   console.log(`${response.status()} ${response.url()}`))
    // .on('requestfailed', request =>
    //   console.log(`${request.failure().errorText} ${request.url()}`))
    const screenshot = require("./screenshot"),
      //dashboard = require("./dashboard.js.js"),
      dotenv = require("dotenv"),

      {
        verbose = false
      } = processData;
    dotenv.config();
    let {
      USER_RA = false,
        PASSWORD_RA = false
    } = process.env;
    if (!USER_RA || !PASSWORD_RA)
      reject("No user or password in .env file");
    if (verbose)
      console.log({
        USER_RA,
        PASSWORD_RA
      });
    await page.goto('https://platform.richaudience.com/login');
    await screenshot(page, "login");
    let leUrl = page.url();
    if (leUrl === 'https://platform.richaudience.com/login') {
      await page.waitForSelector("input#loginform-email");
      await page.click("input#loginform-email");
      await page.type("input#loginform-email", USER_RA, {
        delay: 100
      });
      await page.click("input#loginform-password");
      await page.type("input#loginform-password", PASSWORD_RA, {
        delay: 100
      });
      await screenshot(page, "loginfill");
      await this.w(2000);
      await page.click("button[type='submit']");
      await this.w(5000);
      await screenshot(page, "aftersubmit");
    }
    console.log("logged");
    resolve(page)
  } catch (e) {
    reject(console.error(e));
  }
});
module.exports = login;