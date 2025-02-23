import jwt from "jsonwebtoken";
import request from "supertest";
import * as dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT;
const base_URL = `http://localhost:${PORT}`;

// Create a testUser in your local database and place the following here.
const testUser = {
  id: "ed078fb0-7af1-44e3-9af3-5d6d0ebd3530",
  email: "applicantTestUser@email.com",
  firstName: "applicantTestUser",
  lastName: "test",
};

//Create a test user with the role of 'Client' in your database
/* {
  firstName: "clientTestUser",
  lastName: "test",
  email: "clientTestUser@email.com",
  password: "password",
  role: "Client"
} */

//Use this user to create a company and replace the id here
const testCompany = "e44f1c33-13ed-4432-81ae-156ac0170287";

// Create a listing f.eks like this using the company's id you've just created
// const testListing = {
//   title: "Test listing",
//   tags: "test, listing, jest",
//   description: "listing test with jest",
//   requirements: "t, e, s, t",
//   deadline: "2025-11-30T20:55:00.000Z",
//   company: "e44f1c33-13ed-4432-81ae-156ac0170287"
// };

//Replace listing's id here
const testListing = "e7f7851d-1ad1-4b9a-9885-fb467293bcba";

//Create a second applicant and replace id and email here
const secondUserTest = {
  id: "cfa8e34c-7efc-4a34-a070-7887c6220811",
  email: "secondUserTest@email.com",
};

const token = jwt.sign(
  { userId: testUser.id, email: testUser.email },
  process.env.SECRETSAUCE
);

const secondUsersToken = jwt.sign(
  { userId: secondUserTest.id, email: secondUserTest.email },
  process.env.SECRETSAUCE
);

const invalidToken = "test-token-1234";

const letter = "testing letter";

let applicationTest;

let newCoverLetter = "This is a formal cover letter";

let offersCountTest = {
  offers: 0,
};

describe("POST /applications", () => {
  describe("when not provided with either applicant, listing, company, or cover letter", () => {
    test("should respond with 400 status code", async () => {
      const data = [
        { applicant: testUser.id },
        { listing: testListing },
        { company: testCompany },
        { coverLetter: letter },
        {
          applicant: testUser.id,
          listing: testListing,
        },
        {
          applicant: testUser.id,
          company: testCompany,
        },
        {
          applicant: testUser.id,
          coverLetter: letter,
        },
        {
          listing: testListing,
          company: testCompany,
        },
        {
          listing: testListing,
          coverLetter: letter,
        },
        {
          company: testCompany,
          coverLetter: letter,
        },
        {
          applicant: testUser.id,
          listing: testListing,
          company: testCompany,
        },
        {
          applicant: testUser.id,
          listing: testListing,
          coverLetter: letter,
        },
        {
          applicant: testUser.id,
          company: testCompany,
          coverLetter: letter,
        },
        {
          listing: testListing,
          company: testCompany,
          coverLetter: letter,
        },
        {},
      ];

      for (const body of data) {
        const response = await request(base_URL)
          .post("/applications")
          .send(body)
          .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(400);
      }
    });
  });

  describe("when given listing doesn't exist", () => {
    test("should respond with a 400 status code and the message 'Listing doesn't exist'", async () => {
      const response = await request(base_URL)
        .post("/applications")
        .send({
          applicantId: testUser.id,
          listingId: "fake-listing",
          companyId: testCompany,
          coverLetter: letter,
        })
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Listing doesn't exist");
    });
  });

  describe("when given company doesn't exist", () => {
    test("should respond with a 400 status code and the message 'Company doesn't exist'", async () => {
      const response = await request(base_URL)
        .post("/applications")
        .send({
          applicantId: testUser.id,
          listingId: testListing,
          companyId: "fake-company",
          coverLetter: letter,
        })
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Company doesn't exist");
    });
  });

  describe("when given applicant doesn't exist", () => {
    test("should respond with a 400 status code and the message 'User doesn't exist'", async () => {
      const response = await request(base_URL)
        .post("/applications")
        .send({
          applicantId: "fake-user",
          listingId: testListing,
          companyId: testCompany,
          coverLetter: letter,
        })
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User doesn't exist");
    });
  });

  describe("given an applicant, a listing, a company, and a cover letter", () => {
    it("should return a 201 status code and the application", async () => {
      const res = await request(base_URL)
        .post("/applications")
        .send({
          applicantId: testUser.id,
          listingId: testListing,
          companyId: testCompany,
          coverLetter: letter,
        })
        .set("Authorization", `Bearer ${token}`);

      applicationTest = res.body;

      expect(res.status).toBe(201);
      expect(res.body.id).toEqual(applicationTest.id);
      expect(res.body.applicantId).toEqual(testUser.id);
      expect(res.body.companyId).toEqual(applicationTest.companyId);
      expect(res.body.listingId).toEqual(applicationTest.listingId);
      expect(res.body.coverLetter).toEqual(applicationTest.coverLetter);
      expect(res.body.created).toBeDefined();
      expect(res.body.updated).toBeDefined();
    });
  });

  describe("given the same data", () => {
    it("should return a status code of 409 with application already exist on listing message", async () => {
      const res = await request(base_URL)
        .post("/applications")
        .send({
          applicantId: testUser.id,
          listingId: testListing,
          companyId: testCompany,
          coverLetter: letter,
        })
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toBe(
        "You've already created an application on this listing"
      );
    });

    describe("when not provided with authorisation token", () => {
      test("should return a 401 status code", async () => {
        const res = await request(base_URL).post("/applications");

        expect(res.status).toBe(401);
      });
    });
  });
});

describe("GET /applications", () => {
  describe("given an authorisation token", () => {
    it("should return array of applications and 200 response code", async () => {
      const res = await request(base_URL)
        .get(`/applications`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("when authorisation token is missing", () => {
    it("a 401 response code", async () => {
      const res = await request(base_URL).get(`/applications`);

      expect(res.status).toBe(401);
    });
  });
});

describe("GET /applications/id", () => {
  describe("given an application id, and an authorisation token", () => {
    test("should return a 200 response code", async () => {
      const res = await request(base_URL)
        .get(`/applications/${applicationTest.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it("should return a single application", async () => {
      const res = await request(base_URL)
        .get(`/applications/${applicationTest.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.id).toBe(applicationTest.id);
      expect(res.body.applicantId).toBe(applicationTest.applicantId);
      expect(res.body.companyId).toBe(applicationTest.companyId);
      expect(res.body.listingId).toBe(applicationTest.listingId);
      expect(res.body.coverLetter).toBeDefined();
      expect(res.body.created).toBeDefined();
      expect(res.body.updated).toBeDefined();
      expect(res.body._count).toMatchObject(offersCountTest);
    });
  });

  describe("when not provided with authorisation token", () => {
    test("should return a 401 when not providing authentication", async () => {
      const res = await request(base_URL).get(
        `/applications/${applicationTest.id}`
      );

      expect(res.status).toBe(401);
    });
  });
});

// PUT unit-test
describe("PUT /applications/id", () => {
  describe("given an applicant, a listing, and a company", () => {
    test("should respond with a status code of 200", async () => {
      const response = await request(base_URL)
        .put(`/applications/${applicationTest.id}`)
        .send(applicationTest)
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
    });

    test("should specify json in the content-type header", async () => {
      const response = await request(base_URL)
        .put(`/applications/${applicationTest.id}`)
        .send(applicationTest);

      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("json")
      );
    });

    test("should respond with a json object containing id, applicantId, companyId, listingId, coverLetter, created, updated, response", async () => {
      const response = await request(base_URL)
        .put(`/applications/${applicationTest.id}`)
        .send({
          applicant: applicationTest.applicantId,
          listing: applicationTest.listingId,
          coverLetter: newCoverLetter,
          company: applicationTest.companyId,
        })
        .set("Authorization", `Bearer ${token}`);

      expect(response.body.id).toBeDefined();
      expect(response.body.applicantId).toBeDefined();
      expect(response.body.companyId).toBeDefined();
      expect(response.body.listingId).toBeDefined();
      expect(response.body.coverLetter).toBeDefined();
      expect(response.body.created).toBeDefined();
      expect(response.body.updated).toBeDefined();
      expect(response.body.response).toBe(
        "Your Application is updated successfully"
      );
    });
  });

  describe("when not provided with cover letter", () => {
    test("should respond with 409 status code and the message 'Cover letter is mandatory'", async () => {
      const data = [{}];

      const response = await request(base_URL)
        .put(`/applications/${applicationTest.id}`)
        .send(data)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Cover letter is mandatory");
    });
  });

  describe("when not provided with authorisation token", () => {
    test("should respond with a 401 status code", async () => {
      const response = await request(base_URL)
        .put(`/applications/${applicationTest.id}`)
        .send(applicationTest);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        "User has to be authenticated to make this request"
      );
    });
  });

  describe("when application isn't found in the database", () => {
    test("should respond with a 404 status code and the message 'Application not found'", async () => {
      const response = await request(base_URL).put("/applications/12345");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Application not found");
    });
  });

  describe("when user attempting the update isn't the same user that sent the application", () => {
    test("should respond with a 401 status code and the message 'Unauthorized access: you cannot update or delete another user's application'", async () => {
      const response = await request(base_URL)
        .put(`/applications/${applicationTest.id}`)
        .set("Authorization", `Bearer ${secondUsersToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        "Unauthorized access: you cannot update or delete another user's application"
      );
    });
  });

  describe("when the token is invalid", () => {
    test("should respond with a 403 status code and the message 'Invalid token'", async () => {
      const response = await request(base_URL)
        .put(`/applications/${applicationTest.id}`)
        .set("Authorization", `Bearer ${invalidToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Invalid token");
    });
  });
});

// DELETE unit-test

describe("DELETE /applications/id", () => {
  describe("when not provided with authorisation token", () => {
    test("should respond with a 401 status code and the message 'Unauthorized'", async () => {
      const response = await request(base_URL).delete(
        `/applications/${applicationTest.id}`
      );

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        "User has to be authenticated to make this request"
      );
    });
  });

  describe("when user attempting the delete isn't the same user that sent the application", () => {
    test("should respond with a 401 status code and the message 'Unauthorized access: you cannot update or delete another user's application'", async () => {
      const response = await request(base_URL)
        .delete(`/applications/${applicationTest.id}`)
        .set("Authorization", `Bearer ${secondUsersToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe(
        "Unauthorized access: you cannot update or delete another user's application"
      );
    });
  });

  describe("when the token is invalid", () => {
    test("should respond with a 403 status code and the message 'Invalid token'", async () => {
      const response = await request(base_URL)
        .delete(`/applications/${applicationTest.id}`)
        .set("Authorization", `Bearer ${invalidToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Invalid token");
    });
  });

  describe("when provided with authorisation token", () => {
    it("should delete application and return a 200 response", async () => {
      const res = await request(base_URL)
        .delete(`/applications/${applicationTest.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual("Your Application was successfully deleted");
    });
  });

  describe("when application isn't found in the database", () => {
    it("should return a 404 status code and the message 'Application not found'", async () => {
      const res = await request(base_URL).delete("/applications/12345");

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Application not found");
    });
  });
});
