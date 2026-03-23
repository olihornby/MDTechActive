const getHealth = (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'md-techactive-api',
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getHealth };
