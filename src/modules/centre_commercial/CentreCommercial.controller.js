const { createCentreCommercial } = require ("./CentreCommercial.service");

exports.createCentreController = async (req, res, next) => {
  try {
    const centre = await createCentreCommercial(req.body);

    res.status(201).json({
      success: true,
      data: centre
    });
  } catch (error) {
    next(error);
  }
};