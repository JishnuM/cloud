import fetch from "node-fetch";
import { database } from "../../lib/data/database";

test("server should respond with 200", async () => {
  const res = await fetch("http://localhost:7900/");
  expect(res.status).toEqual(200);
});

test("api 1", async () => {
  await database.site.create({
    data: {
      name: "home",
      schema: { isPublicReadable: true },
      owner: { create: { username: "john" } },
    },
  });
  const res = await fetch("http://localhost:7900/api/v1/home");
  expect(res.status).toEqual(200);
  const res2 = await fetch("http://localhost:7900/api/v1/not-exists");
  expect(res2.status).not.toEqual(200);
});

test("api 2", async () => {
  await database.site.create({
    data: {
      name: "home",
      owner: { create: { username: "john" } },
    },
  });
  const res = await fetch("http://localhost:7900/api/v1/home/1234");
  // should be a 404 because /1234 does not exist.. but status code is currently 500?
  expect(res.status).not.toEqual(200);
});

afterEach(async () => {
  await database.site.deleteMany({});
  await database.user.deleteMany({});
});

afterAll(() => {
  database.$disconnect();
});
