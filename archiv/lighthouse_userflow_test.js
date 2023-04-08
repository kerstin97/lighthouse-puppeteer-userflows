import { writeFileSync } from "fs";
import puppeteer from "puppeteer";
import { startFlow } from "lighthouse";
import dotenv from "dotenv";
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

(async () => {
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

  const config = {
    extends: "lighthouse:default",
    plugins: ["lighthouse-plugin-soft-navigation"],
  };

  const flow = await startFlow(page, { config });

  // Homepage
  await flow.navigate("http://193.170.119.146");

  // Wait for View all events link and navigate to All events
  const showAllEvents = "a";
  await page.waitForSelector(showAllEvents);

  await flow.startNavigation();
  await page.click(showAllEvents);
  await flow.endNavigation();
  await page.waitForNavigation({ waitUntil: "load" });

  console.log("Current page should be events feed:", page.url());

  // All Events

  // Wait for results and click on first event, navigate to event detail
  const eventDetailLink = ".event-card-link";
  await page.waitForSelector(eventDetailLink);

  await flow.startTimespan();
  await page.click(eventDetailLink);
  await page.waitForNavigation({ waitUntil: "load" });
  await flow.endTimespan();

  console.log("Current page is event detail:", page.url());

  // Event Detail

  // Click on Login, navigate to login page
  await clickByText(page, `Login`);
  await page.waitForNavigation({ waitUntil: "load" });
  console.log("Current page is login page:", page.url());

  // Login

  // fill form and send
  //await flow.startTimespan();
  await page.type("#username-input", "kersoleynsta");
  await page.type("#password-input", process.env.PASSWORD);

  await Promise.all([
    page.$eval("form", (form) => form.submit()),
    page.waitForNavigation(),
  ]);
  //await flow.endTimespan();

  // successfully logged in

  await page.waitForNavigation({ waitUntil: "load" });
  console.log("Current page:", page.url());

  // click on create event
  await clickByText(page, `Event erstellen`);
  await page.waitForNavigation({ waitUntil: "load" });
  console.log("Current page:", page.url());

  // Create Event

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
  await clickByText(page, `Meine Events`);
  await page.waitForNavigation({ waitUntil: "load" });
  console.log("Current page:", page.url());

  await browser.close();
  writeFileSync("report.html", await flow.generateReport());
})();
