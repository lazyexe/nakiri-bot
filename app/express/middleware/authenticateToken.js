import { prisma } from '../../utils/prisma.js';

export default async function(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let user = null;

  if (token) {
    await prisma.User.findFirst({
      where: {
        token: token,
      },
    })
      .then(result => {
        user = result;
      })
      .catch(() => {});
  }

  req.user = user;

  next();
};
