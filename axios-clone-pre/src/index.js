const Pagination = require("./pagination");

(async () => {
  const pagination = new Pagination();

  const firstPage = 770e3;
  const request = pagination.getPaginated({
    url: "https://www.mercadobitcoin.net/api/BTC/trades/",
    page: firstPage
  });
  for await (const items of request) {
    console.table(items);
    // console.log(items);
  }
})();
