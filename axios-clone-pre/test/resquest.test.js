const { describe, it, before, afterEach } = require("mocha");
const assert = require("assert");
const Request = require("../src/request");
const { createSandbox } = require("sinon");
const Events = require("events");

describe("Request Helpers", () => {
  const timeout = 15;
  let sandbox;
  let request;

  before(() => {
    sandbox = createSandbox();
    request = new Request();
  });

  afterEach(() => {
    // limpando o estado
    sandbox.restore();
  });

  it(`should throw a timeout error when the function has spent more than ${timeout}ms`, async () => {
    const exceededTimeout = timeout + 10;
    // stub da função get, para nao atrapalha nos testes
    sandbox
      .stub(request, request.get.name)
      .callsFake(() => new Promise((resolve) => setTimeout(resolve, exceededTimeout)));
    const call = request.makeRequest({ url: "https://testing.com", method: "get", timeout });
    await assert.rejects(call, { message: "timeout at [https://testing.com] (˘･_･˘)" });
  });

  it(`should return ok when promise time is ok`, async () => {
    const expected = { ok: "ok" };
    sandbox.stub(request, request.get.name).callsFake(async () => {
      await new Promise((resolve) => setTimeout(resolve));
      return expected;
    });
    const call = () => request.makeRequest({ url: "https://testing.com", method: "get", timeout });
    await assert.doesNotReject(call());
    assert.deepStrictEqual(await call(), expected);
  });

  it("should return a JSON object after a request", async () => {
    const data = [Buffer.from('{"ok": '), Buffer.from('"ok"'), Buffer.from("}")];
    const responseEvent = new Events();
    const httpEvent = new Events();
    const https = require("https");
    // cortando acesso a internet no teste para https
    sandbox.stub(https, https.get.name).yields(responseEvent).returns(httpEvent);
    const expected = { ok: "ok" };
    const pendingPromise = request.get("https://testing.com");

    responseEvent.emit("data", data[0]);
    responseEvent.emit("data", data[1]);
    responseEvent.emit("data", data[2]);
    responseEvent.emit("end");

    const result = await pendingPromise;
    assert.deepStrictEqual(result, expected);
  });
});
