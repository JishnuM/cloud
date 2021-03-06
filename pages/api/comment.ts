import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../lib/data/database";
import { Error400 } from "../../lib/server/Errors";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { createAPI } from "../../lib/server/createAPI";

export type CommentPayload = {
  message: string;
  page: string;
};

function validatePayload(input: any): CommentPayload {
  if (!input)
    throw new Error400({
      message: "Request body not provided.",
      name: "NoBody",
    });
  const { message, page } = input;
  if (!message) {
    throw new Error400({
      message: "Empty comment message! ",
      name: "InvalidComment",
    });
  }
  if (!page) {
    throw new Error400({
      message: "No page destination! ",
      name: "InvalidPage",
    });
  }
  return { message, page };
}

async function publishComment(user: APIUser, { message, page }: CommentPayload, res: NextApiResponse) {
  const comment = await database.comment.create({
    data: {
      user: { connect: { id: user.id } },
      message,
      page,
    },
  });
  return { id: comment.id };
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const verifiedUser = await getVerifiedUser(req, res);
  if (!verifiedUser) {
    throw new Error400({ message: "No Authenticated User", name: "NoAuth" });
  }
  return await publishComment(verifiedUser, validatePayload(req.body), res);
});

export default APIHandler;
