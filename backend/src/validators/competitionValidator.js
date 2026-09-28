const { param } = require('express-validator');
const mongoose = require('mongoose');

const competitionIdValidator = [
  param('competitionId')
    .notEmpty()
    .withMessage('Competition ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid competition ID format');
      }
      return true;
    }),
];

module.exports = { competitionIdValidator };
