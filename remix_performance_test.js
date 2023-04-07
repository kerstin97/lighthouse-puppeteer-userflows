import { writeFileSync } from "fs";
import puppeteer from "puppeteer";
import { startFlow } from "lighthouse";
import config from "lighthouse/core/config/desktop-config.js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const escapeXpathString = (str) => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
};

const clickByText = async (page, text) => {
  const escapedText = escapeXpathString(text);
  const linkHandlers = await page.$x(`//a[contains(text(), ${escapedText})]`);
  const buttonHandlers = await page.$x(
    `//button[contains(text(), ${escapedText})]`
  );

  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else if (buttonHandlers.length > 0) {
    await buttonHandlers[0].click();
  } else {
    throw new Error(`Link not found: ${text}`);
  }
};

const testIterations = 5;

const adaptedDesktopSettings = {
  ...config.settings,
  onlyCategories: ["performance"],
  output: ["json", "html"],
};

const final = { ...config, settings: adaptedDesktopSettings };

// run lighthouse test 5 times and save reports as html and json
for (let i = 0; i < testIterations; i++) {
  await (async () => {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [`--window-size=1350,940`],
      defaultViewport: {
        width: 1350,
        height: 940,
      },
    });
    const page = await browser.newPage();

    const flow = await startFlow(page, {
      config: final,
    });

    // Homepage
    await flow.navigate("http://193.170.119.146");
    // Events
    await flow.navigate("http://193.170.119.146/events");
    // Event Detail
    await flow.navigate(
      "http://193.170.119.146/events/88a85175246ccb8c58a2d6cec"
    );
    //Login Page
    await flow.navigate("http://193.170.119.146/login");

    // fill form and send
    await page.type("#username-input", "kersoleynsta");
    await page.type("#password-input", process.env.PASSWORD);

    await Promise.all([
      page.$eval("form", (form) => form.submit()),
      page.waitForNavigation(),
    ]);

    // successfully logged in

    await page.waitForNavigation({ waitUntil: "load" });
    console.log("Current page:", page.url());

    // Create Event Page
    await flow.navigate("http://193.170.119.146/events/new");

    console.log("Current page:", page.url());

    // Create Event - Fill in form
    await page.waitForSelector("input[name=title]");
    await page.type("input[name=title]", "pupeteer test");
    await page.waitForSelector("textarea[name=info]");
    await page.type("textarea[name=info]", "pupeteer test");
    await page.waitForSelector("input[name=date]");
    await page.type("input[name=date]", "25110020231000");
    await page.waitForSelector("input[name=costs]");
    await page.type("input[name=costs]", "5");
    await page.waitForSelector("input[name=capacity]");
    await page.type("input[name=capacity]", "5");

    console.log("Current page:", page.url());
    await clickByText(page, `Speichern`);

    await page.waitForNavigation({ waitUntil: "load" });
    console.log("Current page:", page.url());

    // My Events
    await flow.navigate("http://193.170.119.146/events/my-events");
    console.log("Current page:", page.url());

    await browser.close();

    writeFileSync(`report_remix${i}.html`, await flow.generateReport());
    writeFileSync(
      `report_remix${i}.json`,
      JSON.stringify(await flow.createFlowResult(), null, 2)
    );
  })();
}

// function for csv generation
const jsonToCsv = (inputFile, outputFile, run) => {
  fs.readFile(inputFile, "utf-8", (error, data) => {
    if (error) {
      console.error("Error reading JSON file:", error);
      return;
    }

    const jsonData = JSON.parse(data);
    const csvData = parseJsonToCsv(jsonData, run);

    fs.writeFile(outputFile, csvData, "utf-8", (error) => {
      if (error) {
        console.error("Error writing CSV file:", error);
        return;
      }

      console.log("CSV file has been created:", outputFile);
    });
  });
};

const parseJsonToCsv = (jsonData, run) => {
  const header = "requestedUrl,fcp,lcp,speedIndex,tbt,cls,run\n";
  let rows = "";

  jsonData.steps.forEach((item) => {
    const row = `${item.lhr.requestedUrl},${item.lhr.audits["first-contentful-paint"].numericValue},${item.lhr.audits["largest-contentful-paint"].numericValue},${item.lhr.audits["speed-index"].numericValue},${item.lhr.audits["total-blocking-time"].numericValue},${item.lhr.audits["cumulative-layout-shift"].numericValue},${run}\n`;
    rows += row;
  });

  return header + rows;
};

// store results from jsons in one csv file
for (let i = 0; i < testIterations; i++) {
  const inputFile = `report_remix${i}.json`;
  const outputFile = `report_remix${i}.csv`;
  jsonToCsv(inputFile, outputFile, i);
}
