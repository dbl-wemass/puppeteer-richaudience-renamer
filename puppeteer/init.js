class wemassPuppeteer {
  page;
  browser;
  constructor(options) {
    this.options = options;
    this.verbose = options.verbose || false;
    this.verbose && console.log(chalk.yellow("Inicializando Puppeteer"));
  }
  async w(waitFor = 500) {
    return new Promise(resolve => setTimeout(resolve, waitFor))
  }
  async getProps () {
    let output = [];
    for (let item of allitems) {
      const attr = await this.page.evaluate(el => {
        return {
          "title": el.getAttribute("title"),
          "href": el.getAttribute("href")
        }
      }, item);
      output.push(attr);
    }
    return output;
  }
  async init() {
    const
      puppeteer = require("puppeteer"),
      login = require("./login.js"),
      {
        startX,
        stopX
      } = require("./util/windows"),
      {
        esWSL = false,
        USER_DATA_DIR = './temp/pupuserdata',
        browserOptions = {
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', "--window-size=1280,1024"],
          headless: false,
          defaultViewport: {
            width: 1280,
            height: 1024
          }
        },
        verbose = false,
      } = this.options;
    if (esWSL) {
      startX(verbose);
    }
    try {
      if (USER_DATA_DIR)
        browserOptions.userDataDir = USER_DATA_DIR;

      this.browser = await puppeteer.launch(browserOptions);
      this.page = await this.browser.newPage();
      // await page.setViewport({
      //   width: 1440,
      //   height: 1080
      // });
      await this.login();
    } catch (e) {

    }
  }
  async login(processData = {}) {
    return new Promise(async (resolve, reject) => {
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
        await this.page.goto('https://platform.richaudience.com/login');
        await screenshot(this.page, "login");
        let leUrl = this.page.url();
        if (leUrl === 'https://platform.richaudience.com/login') {
          await this.page.waitForSelector("input#loginform-email");
          await this.page.click("input#loginform-email");
          await this.page.type("input#loginform-email", USER_RA);
          await this.page.click("input#loginform-password");
          await this.page.type("input#loginform-password", PASSWORD_RA);
          await screenshot(this.page, "loginfill");
          await this.page.click("button[type='submit']");
        }
        await this.page.waitForSelector("#page_content");
        await screenshot(this.page, "afterlogin");
        console.log("logged");
        resolve(this.page)
      } catch (e) {
        reject(console.error(e));
      }
    })
  };
  async showAll() {
    const
      selectSelctor = ".selectize-input",
      showAllSelector = "div.option[data-value='-1']";
    await this.page.waitForSelector(selectSelctor);
    await this.page.click(selectSelctor);
    await this.page.waitForSelector(showAllSelector);
    await this.page.click(showAllSelector);
    await this.page.waitForResponse(
      (response) =>
      response.url().indexOf('https://platform.richaudience.com/certification/datatable') === 0 && response.status() === 200
    );
    //await this.page.waitForFunction(waiting.toString());
  }
  async get(que, quien) {
    console.log("get", que, quien);
    let diccionario = {
      certification: {
        base: "https://platform.richaudience.com/certification",
        getOne: {
          extraUrl: "view/_HASH_"
        },
        getAll: async () => {
          await this.showAll("certification-datatable");

          let allitems = await this.page.$$("#certification-datatable div>a.lnkEditDatatable");
          return this.getProps(allitems);
        }
      },
      placement: {
        base: "https://platform.richaudience.com/placements",
        get: "update//_HASH_",
        edit: "update//_HASH_",
        
        getAll: async () => {
          await this.showAll("placement-datatable");

          let allitems = await this.page.$$("#placement-datatable div>a.lnkEditDatatable");
          return this.getProps(allitems);
        }
      },
      site: {
        base: "https://platform.richaudience.com/sites",
        get: "update/_HASH_",
        edit: ""
      }
    };
    if (diccionario[que]) {
      console.log("changing to " + diccionario[que].base)
      await this.page.goto(diccionario[que].base);
      return diccionario[que].getAll();
    }
    /**
     * click en "div.option[data-value='-1']" para mostrar todos
     * placement
     * site
     */
  };
  async close() {
    const rimraf = require("rimraf"),
      {
        esWSL = false,
        USER_DATA_DIR = './temp/pupuserdata',
      } = this.options;
    await this.browser.close();
    if (USER_DATA_DIR)
      rimraf(USER_DATA_DIR, () => this.verbose && console.log(chalk.yellow("Borrados Archivos temporales")))
    if (esWSL) {
      stopX(this.verbose);
    }
  }
};
module.exports = wemassPuppeteer;