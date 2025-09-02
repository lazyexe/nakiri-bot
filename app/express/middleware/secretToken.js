export default async function (req, res, next) {
  if (req.headers['secret-token'] !== process.env.SECRET_TOKEN) {
    return res.status(403).json({
      message: 'LOL',
    });
  }

  next();
};
