const request = require("request-promise");
const cheerio = require("cheerio");
const { json, errorJson } = require("../utils/response");

const BASE_URL = process.env.BASE_URL || "https://www.gsmarena.com";

// Upstream blocks/ratelimits requests that don't look like a browser.
const fetchHtml = (url) =>
  request.get({
    url,
    timeout: 20000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

const upstreamError = (res, error) => {
  if (error.name === "StatusCodeError") {
    const status = error.statusCode === 404 ? 404 : 502;
    return errorJson(res, `upstream responded with ${error.statusCode}`, status);
  }
  return errorJson(res, error.message || error);
};

exports.index = async (req, res) => {
  try {
    const url = `${BASE_URL}/makers.php3`;
    const htmlResult = await fetchHtml(url);
    const $ = cheerio.load(htmlResult);
    const brands = [];
    $(".st-text table td").each((index, el) => {
      const element = $(el).children("a").first();
      const href = element.attr("href");
      // e.g. "samsung-phones-9.php"
      const match = href && href.match(/^(.+-(\d+))\.php$/);
      if (!match) return;

      const device_count = element.find("span").text();
      const brand_name = element.text().replace(device_count, "").trim();
      const brand_slug = match[1];
      brands.push({
        brand_id: parseInt(match[2]),
        brand_name,
        brand_slug,
        device_count: parseInt(device_count) || 0,
        detail:
          req.protocol + "://" + req.get("host") + "/brands/" + brand_slug,
      });
    });

    if (brands.length === 0) {
      return errorJson(res, "could not parse brand list from upstream", 502);
    }

    return json(res, brands);
  } catch (error) {
    return upstreamError(res, error);
  }
};

exports.show = async (req, res) => {
  try {
    const slug = req.params.slug;
    let page = req.query.page;
    let url;
    if (page === undefined || page == 1) {
      url = `${BASE_URL}/${slug}.php`;
      page = 1;
    } else {
      // apple-phones-48 -> apple-phones-f-48-0-p2.php
      const match = slug.match(/^(.+-phones)-(\d+)$/);
      if (!match) {
        return errorJson(res, `invalid brand slug: ${slug}`, 400);
      }
      url = `${BASE_URL}/${match[1]}-f-${match[2]}-0-p${page}.php`;
    }
    const htmlResult = await fetchHtml(url);
    const $ = cheerio.load(htmlResult);
    const title = $(".article-info-name").text();
    const last_page = $(".nav-pages").find("a").length;
    const phones = [];
    $(".makers")
      .children("ul")
      .children("li")
      .each((index, el) => {
        const href = $(el).children("a").attr("href");
        if (!href) return;
        const slug = href.replace(".php", "");
        const image = $(el).find("img").attr("src");
        const phone_name = $(el).children("a").text();
        phones.push({
          brand: title.replace("phones", ""),
          phone_name,
          slug,
          image,
          detail: req.protocol + "://" + req.get("host") + "/" + slug,
        });
      });

    return json(res, {
      title,
      current_page: parseInt(page),
      last_page: parseInt(last_page) + 1,
      phones,
    });
  } catch (error) {
    return upstreamError(res, error);
  }
};
