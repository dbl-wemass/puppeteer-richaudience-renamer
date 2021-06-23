const fs = require("fs");
let screenshot = async (page, path) => {
    if(!fs.existsSync(`${process.cwd()}/shots`))
        fs.mkdirSync(`${process.cwd()}/shots`);
    await page.screenshot({
        path: `${process.cwd()}/shots/${path}.jpg`,
        fullPage: true,
        type: "jpeg",
        omitBackground: false
    });
};
module.exports=screenshot;