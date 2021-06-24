const {
  parse
} = require('node-html-parser');
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
  async getProps(type, allitems) {
    let output = [],
      {
        recordsFiltered,
        recordsTotal,
        data = []
      } = allitems;
    console.log(`parseando ${recordsFiltered} de ${recordsTotal}`);
    for (let item of data) {
      const {
        //*comunes
        NAME = "",
          HASH: hash,
          //*solo placements
          PREBID,
          TYPE_NAME,
          //!site y placements
          ID_STATUS,
          //*solo sites
          URL,
      } = item;
      let
        domElement = parse(NAME),
        object = {
          hash
        };
      switch (type) {
        case "certification":
          object.name = domElement.querySelector("a").getAttribute("title");
          object.domain = domElement.querySelector("i").textContent.trim();
          break;
        case "placement":
          object.name = domElement.querySelector("a").getAttribute("title");
          object.domain = domElement.querySelector("i").textContent.trim();
          object.prebid = PREBID;
          domElement = parse(TYPE_NAME);
          [object.format, object.subformats] = domElement.textContent.trim().split("\n");
          object.subformats = object.subformats.trim().split(", ");
          domElement = parse(ID_STATUS);
          object.status = domElement.textContent.trim();
          break;
        case "site":
          domElement = parse(URL);
          object.name = domElement.textContent.trim();
          domElement = parse(ID_STATUS);
          object.status = domElement.textContent.trim();
          break
      }
      output.push(object);
    }
    return output;
  }
  async init() {
    console.log("innit")
    const
      puppeteer = require("puppeteer"),
      {
        startX,
        stopX
      } = require("./util/windows"),
      {
        esWSL = true,
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
      console.log(e);
    }
  }
  async login(processData = {}) {
    console.log("logando")
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
    let response = await this.page.waitForResponse(
        (response) =>
        /^https:\/\/platform\.richaudience\.com.*datatable/i.test(response.url()) && response.status() === 200
      ),
      responseData = await response.json();
    return responseData;
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
          let allitems = await this.showAll("certification-datatable");

          //let allitems = await this.page.$$("#certification-datatable div>a.lnkEditDatatable");
          return await this.getProps(que, allitems);
        }
      },
      placement: {
        base: "https://platform.richaudience.com/placements",
        get: "update//_HASH_",
        edit: "update//_HASH_",

        getAll: async () => {
          let allitems = await this.showAll("placement-datatable");
          //let allitems = await this.page.$$("#placement-datatable>tbody>tr[role='row']");
          return await this.getProps(que, allitems);
        }
      },
      site: {
        base: "https://platform.richaudience.com/sites",
        get: "update/_HASH_",
        edit: "",
        getAll: async () => {
          let allitems = await this.showAll("sites-datatable");
          //let allitems = await this.page.$$("#placement-datatable>tbody>tr[role='row']");
          return await this.getProps(que, allitems);
        }
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