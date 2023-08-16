// Scraper for Dior Products
// First it scrapes all the prodcuts IDs and
// then it uses the Dior's public API to get the complete product info
// @hizbi-github - 2023 - MIT License

import * as playwright from "playwright";
import { appendFileSync, readFileSync} from "fs";
import path from "path";

const currentProcessDir = process.cwd();

/** @type {playwright.Browser} */
let browser = null;
/** @type {playwright.BrowserContext} */
let browserWindow = null;
/** @type {playwright.Page} */
let page = null;

// Packaging Command: 
// npx caxa --input "." --output "Dior_Scraper.exe" -- "{{caxa}}/node_modules/.bin/node" "{{caxa}}/scraper.js"

/////////////////////// MAIN LOOP ///////////////////////

await launchBrowser();

await scrapProductIDs();

await closeBrowser();

await getCompleteProductInfoFromAPI();

/////////////////////// METHODS ///////////////////////

async function launchBrowser()
{
    console.log("\n> Launching the Browser...");
    console.log("=============================================");

    browser = await playwright.chromium.launch({headless: false, args:['--start-maximized']});
    browserWindow = await browser.newContext();
    page = await browserWindow.newPage();

    browserWindow.setDefaultTimeout(10 * 1000);
    browserWindow.setDefaultNavigationTimeout(50 * 1000);
}

async function closeBrowser()
{
    await browser.close();

    console.log("\n=============================================");
    console.log("> Closing the Browser...\n");
}

async function scrapProductIDs()
{
    await page.goto("https://www.dior.com/en_us/beauty/mens-fragrance");

    let totalProducts = await page.locator("[data-gtm-ecom-item=item_product_master_id]").count();

    console.log(`> Total Products: ${totalProducts}\n`);

    for (let index = 0; index < totalProducts; index++)
    {
        let productID = (await page.locator("[data-gtm-ecom-item=item_product_master_id]").nth(index).innerText()).trim();
        let productName = (await page.locator("[data-gtm-ecom-item=item_name]").nth(index).innerText()).trim();
        let productCatOne = (await page.locator("[data-gtm-ecom-item=item_category]").nth(index).innerText()).trim();
        let productCatTwo = (await page.locator("[data-gtm-ecom-item=item_category2]").nth(index).innerText()).trim();

        console.log(`> ${index + 1}. ID: ${productID}, Name: ${productName}, Cat-1: ${productCatOne}, Cat-2: ${productCatTwo}`);

        let scrapedDataString = `${productID}~${productName}~${productCatOne}~${productCatTwo}\n`;
        saveDataToFile(scrapedDataString, "dior_product_IDs.csv");
    }
}

async function getCompleteProductInfoFromAPI()
{
    let basicProductData = readDataFromFile("dior_product_IDs.csv"); // This file is expected to be at root

    if (basicProductData !== "")
    {
        console.log("\n> Dior Product IDs loaded from the CSV file...");
        console.log(`> Number of Product IDs: ${basicProductData.split("\n").length}\n`);

        let counter = 0;

        for (let row of basicProductData.split("\n"))
        {
            let productID = row.split("~")[0];
            let productName = row.split("~")[1];

            let productInfo = await (await fetch(`https://www.dior.com/on/demandware.store/Sites-dior_us-Site/en_US/Product-AllVariations?pid=${productID}`)).json();

            // Do whatever want with the complete product info...
            counter = counter + 1;
            console.log(`\n> ${counter}. ID: ${productID}, Name: ${productName}`);
            console.log(productInfo);
        }

        console.log("\n=============================================");
        console.log("> Done!\n");
        process.exit();
    }
    else
    {
        console.log("> [ERROR] Failed to load Dior Product IDs loaded from the CSV file...");
        process.exit();
    }
}

function saveDataToFile(dataCSVString, fileName)
{
    try 
    {
        appendFileSync(path.join(currentProcessDir, fileName), dataCSVString);
    } 
    catch (error) 
    {
        console.log(error);
        console.log("> [ERROR] Sorry but there was a file append error!");
    }
}

function readDataFromFile(fileName)
{
    try 
    {
        let fileString = readFileSync(path.join(currentProcessDir, fileName), "utf8");
        fileString = fileString.trim();
        return(fileString);
    } 
    catch (error) 
    {
        console.log(`\n> Sorry but "${fileName}" was not found in the current directory! Using defaults...`);
        return("NA");
    }
}

//////////////////////////////////////////////////////
