const { describe, it, before, afterEach } = require("mocha");
const assert = require("assert");
const { createSandbox } = require("sinon");
const Pagination = require("../src/pagination");
const Request = require("../src/request");

describe("Pagination tests", () => {
  let sandbox;

  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => sandbox.restore());

  it(`should have default options on Pagination instance`, () => {
    const pagination = new Pagination();
    const expectedProperties = {
      maxRetries: 4,
      retryTimeout: 1000,
      maxRequestTimeout: 1000,
      threshold: 200
    };

    assert.ok(pagination.request instanceof Request);
    Reflect.deleteProperty(pagination, "request");

    const getEntries = (item) => Object.entries(item);
    assert.deepStrictEqual(getEntries(pagination), getEntries(expectedProperties));
  });

  it(`should set default options on Pagination instance`, () => {
    const params = {
      maxRetries: 2,
      retryTimeout: 100,
      maxRequestTimeout: 10,
      threshold: 10
    };

    const pagination = new Pagination(params);
    const expectedProperties = params;

    assert.ok(pagination.request instanceof Request);
    Reflect.deleteProperty(pagination, "request");

    const getEntries = (item) => Object.entries(item);
    assert.deepStrictEqual(getEntries(pagination), getEntries(expectedProperties));
  });

  describe("#sleep", () => {
    it("should be a Promise object and not return values", async () => {
      const clock = sandbox.useFakeTimers();
      const time = 1;
      const pendingPromise = Pagination.sleep(time);
      clock.tick(time);

      assert.ok(pendingPromise instanceof Promise);
      const result = await pendingPromise;
      assert.ok(result === undefined);
    });
  });

  describe("#handleRequest", () => {
    it("should retry an request twice before throning an exception and validate request params and flow", async () => {
      const expectedCallCount = 2;
      const expectedTimeout = 10;

      const pagination = new Pagination();
      pagination.maxRetries = expectedCallCount;
      pagination.retryTimeout = expectedTimeout;
      pagination.maxRequestTimeout = expectedTimeout;

      const error = new Error("timeout");
      // retorna quantas vezes handleRequest foi chamada
      sandbox.spy(pagination, pagination.handleRequest.name);

      sandbox.stub(Pagination, Pagination.sleep.name).resolves();
      sandbox.stub(pagination.request, pagination.request.makeRequest.name).rejects(error);

      const dataRequest = { url: "https://google.com", page: 0 };
      await assert.rejects(pagination.handleRequest(dataRequest), error);
      assert.deepStrictEqual(pagination.handleRequest.callCount, expectedCallCount);

      const lastCall = 1;
      // getCall vindo do spy
      const firstCallArg = pagination.handleRequest.getCall(lastCall).firstArg;
      const firstCallRetries = firstCallArg.retries;
      assert.deepStrictEqual(firstCallRetries, expectedCallCount);

      const expectedArgs = {
        url: `${dataRequest.url}?tid=${dataRequest.page}`,
        method: "get",
        timeout: expectedTimeout
      };
      const firstCall = 0;
      const firstCallArgs = pagination.request.makeRequest.getCall(firstCall).args;
      assert.deepStrictEqual(firstCallArgs, [expectedArgs]);

      assert.ok(Pagination.sleep.calledWithExactly(expectedTimeout));
    });

    it("should return data from request when succeeded", async () => {
      const data = { result: "ok" };
      const pagination = new Pagination();
      sandbox.stub(pagination.request, pagination.request.makeRequest.name).resolves(data);

      const result = await pagination.handleRequest({ url: "https://google.com", page: 1 });
      assert.deepStrictEqual(result, data);
    });
  });

  describe("#getPaginated", () => {
    const responseMock = [
      {
        tid: 5705,
        date: 1373123005,
        type: "sell",
        price: 196.52,
        amount: 0.01
      },
      {
        tid: 5706,
        date: 1373124523,
        type: "buy",
        price: 200,
        amount: 0.3
      }
    ];
    it("should update request id on each request", async () => {
      const pagination = new Pagination();
      sandbox.stub(Pagination, Pagination.sleep.name).resolves();
      const firstCall = 0,
        secondCall = 1,
        lastCall = 2;
      sandbox
        .stub(pagination, pagination.handleRequest.name)
        .onCall(firstCall)
        .resolves([responseMock[0]])
        .onCall(secondCall)
        .resolves([responseMock[1]])
        .onCall(lastCall)
        .resolves([]);

      sandbox.spy(pagination, pagination.getPaginated.name);
      const data = { url: "google.com", page: 1 };
      const secondCallExpectation = {
        ...data,
        page: responseMock[0].tid
      };
      const thirdCallExpectation = {
        ...secondCallExpectation,
        page: responseMock[1].tid
      };
      // para chamar uma função que é um generator
      // Array.from(pagination.getPaginated()) => dessa forma ele nao espera os dados sob demanda!
      // ele vai guardar tudo em memoria e só depois jogar no array
      // const r = pagination.getPaginated()
      // r.next() => { done: true | false, value: {} }
      // a melhor forma é usar o for of

      const gen = pagination.getPaginated(data);
      for await (const result of gen) {
      }

      const getFirstArgFromCall = (value) => pagination.handleRequest.getCall(value).firstArg;
      assert.deepStrictEqual(getFirstArgFromCall(firstCall), data);
      assert.deepStrictEqual(getFirstArgFromCall(secondCall), secondCallExpectation);
      assert.deepStrictEqual(getFirstArgFromCall(lastCall), thirdCallExpectation);
    });

    it("should stop requesting when request return an empty array", async () => {
      const expectedThreshold = 20;
      const pagination = new Pagination();
      pagination.threshold = expectedThreshold;
      sandbox.stub(Pagination, Pagination.sleep.name).resolves();
      const firstCall = 0,
        lastCall = 1;
      sandbox
        .stub(pagination, pagination.handleRequest.name)
        .onCall(firstCall)
        .resolves([responseMock[0]])
        .onCall(lastCall)
        .resolves([]);
      sandbox.spy(pagination, pagination.getPaginated.name);
      const data = { url: "google.com", page: 1 };

      const iterator = await pagination.getPaginated(data);
      const [firstResult, secondResult] = await Promise.all([iterator.next(), iterator.next()]);

      const expectedFirstCall = { done: false, value: [responseMock[0]] };
      assert.deepStrictEqual(firstResult, expectedFirstCall);
      const expectedSecondCall = { done: true, value: undefined };
      assert.deepStrictEqual(secondResult, expectedSecondCall);

      assert.deepStrictEqual(Pagination.sleep.callCount, 1);
      assert.ok(Pagination.sleep.calledWithExactly(expectedThreshold));
    });
  });
});
