import request from "supertest";
import routes from "@/routes";

describe("Test the root path", () => {
    test("It should response the GET method", done => {
        request(routes)
            .get("/")
            .then(response => {
                expect(response.statusCode).toBe(200);
                done();
            });
    });
});