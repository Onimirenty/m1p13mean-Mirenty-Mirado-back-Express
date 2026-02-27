const BoxService = require("./Box.service");

exports.createBox = async (req, res, next) => {
  try {
    const box = await BoxService.createBox(req.body);
    res.status(201).json({ message: "Box created", box });
  } catch (error) {
    next(error);
  }
};

exports.getAllBoxes = async (req, res, next) => {
  try {
    const boxes = await BoxService.getAllBoxes(req.query);
    res.status(200).json({ message: "Boxes fetched", boxes });
  } catch (error) {
    next(error);
  }
};
exports.getBoxByCompositeKey = async (req, res, next) => {
  try {
    // console.log("swwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwdfghjkl;");
    // console.log(req.params.cmSlug);
    // console.log(req.params.etage);
    // console.log(req.params.bloc);
    // console.log(req.params.numero);
    // const box = await BoxService.getBoxByCompositeKey({
    //   cmSlug: req.params.cmSlug,
    //   etage: Number(req.params.etage),
    //   bloc: req.params.bloc,
    //   numero: Number(req.params.numero)
    // });
    // console.log(`cm : ${req.body.cmSlug}  ,etage ${req.body.etage} ,bloc ${req.body.bloc} , numero ${req.body.numero}`);
    const box = await BoxService.getBoxByCompositeKey({
      cmSlug: req.body.cmSlug,
      etage: Number(req.body.etage),
      bloc: req.body.bloc,
      numero: Number(req.body.numero)
    });

    res.status(200).json({ box });
  } catch (error) {
    next(error);
  }
};
exports.getBoxById = async (req, res, next) => {
  try {
    const box = await BoxService.getBoxById(req.params.id);
    res.status(200).json({ box });
  } catch (error) {
    next(error);
  }
};

exports.updateBox = async (req, res, next) => {
  try {
    const box = await BoxService.updateBox(req.params.id, req.body);
    res.status(200).json({ message: "Box updated", box });
  } catch (error) {
    next(error);
  }
};

exports.deleteBox = async (req, res, next) => {
  try {
    await BoxService.deleteBox(req.params.id);
    res.status(200).json({ message: "Box deleted successfully" });
  } catch (error) {
    next(error);
  }
};