const
    richaudience = async (action, service, options = {}) => new Promise(async (resolve, reject) => {
        /**actions
         ** get
         ** create
         ** edit
         * 
         * service
         **certificacion - get
         **placement - get, create, edit, delete
         **site get, create, edit ,delete, setFloors
         **
         * createPlacements
         */

        const
            wemassPuppeteer = require("./puppeteer/init"),
            raClient = new wemassPuppeteer(options);
        await raClient.init();
        resolve(raClient);
    });
module.exports = richaudience;