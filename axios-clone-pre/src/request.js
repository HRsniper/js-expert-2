const https = require("https");

class Request {
  errorTimeout = (reject, urlRequest) => () => reject(new Error(`timeout at [${urlRequest}] (˘･_･˘)`));

  raceTimeoutDelay(url, timeout) {
    return new Promise((resolve, reject) => {
      setTimeout(this.errorTimeout(reject, url), timeout);
    });
  }

  async get(url) {
    return new Promise((resolve, reject) => {
      https
        .get(url, (response) => {
          const items = [];
          response
            .on("data", (data) => items.push(data))
            .on("end", () => resolve(JSON.parse(items.join(""))));
        })
        .on("error", reject);
    });
  }

  async makeRequest({ url, method: method, timeout }) {
    // [method] pegando obj dinâmico no casso get()
    return Promise.race([this[method](url), this.raceTimeoutDelay(url, timeout)]);
  }
}
module.exports = Request;
